import urllib.parse
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from ..extensions import db
from ..models import Book, BookContent
from ..services import open_library      as ol_service
from ..services import google_books      as gb_service
from ..services import gutenberg         as gut_service
from ..services import internet_archive  as ia_service

books_bp = Blueprint("books", __name__)

CACHE_TTL_HOURS = 24


def _is_stale(cached_at):
    return cached_at is None or (datetime.utcnow() - cached_at) > timedelta(hours=CACHE_TTL_HOURS)


def _upsert_book(data):
    """Find or create a Book row from normalized API data."""
    book = Book.query.filter_by(external_id=data["external_id"]).first()
    if not book:
        book = Book(
            external_id=data["external_id"],
            source=data["source"],
            title=data["title"],
            author=data.get("author", ""),
            genres=data.get("genres", []),
            description=data.get("description"),
            cover_url=data.get("cover_url"),
        )
        db.session.add(book)
    return book


def _clean_gutenberg_text(text):
    """Strip Project Gutenberg header/footer boilerplate from raw text."""
    # Common start markers
    start_markers = [
        "*** START OF THE PROJECT GUTENBERG",
        "*** START OF THIS PROJECT GUTENBERG",
        "*END*THE SMALL PRINT",
        "***START OF THE PROJECT GUTENBERG",
    ]
    # Common end markers
    end_markers = [
        "*** END OF THE PROJECT GUTENBERG",
        "*** END OF THIS PROJECT GUTENBERG",
        "***END OF THE PROJECT GUTENBERG",
        "End of the Project Gutenberg",
        "End of Project Gutenberg",
    ]

    upper = text.upper()

    # Strip header — find the last start marker and skip that line
    start_pos = 0
    for marker in start_markers:
        idx = upper.find(marker.upper())
        if idx != -1:
            # Move past this line
            line_end = text.find("\n", idx)
            if line_end != -1:
                start_pos = line_end + 1
            break

    # Strip footer
    end_pos = len(text)
    for marker in end_markers:
        idx = upper.find(marker.upper(), start_pos)
        if idx != -1:
            end_pos = idx
            break

    cleaned = text[start_pos:end_pos].strip()
    return cleaned if cleaned else text   # fallback: return original if markers not found


def _buy_links(title, author):
    """Generate external buy/find links for a book."""
    q = urllib.parse.quote_plus(f"{title} {author}".strip())
    return {
        "open_library": f"https://openlibrary.org/search?q={q}",
        "google_books": f"https://books.google.com/books?q={q}",
        "amazon":       f"https://www.amazon.com/s?k={q}&i=stripbooks",
    }


def _book_dict_with_content(book, raw_data=None):
    """Build the response dict for a book including content_type and buy links."""
    d = book.to_dict()

    if book.content:
        d["content_type"] = book.content.content_type
        d["content_url"]  = book.content.content_url
    else:
        # OL/GB books haven't been content-checked yet — assume purchasable
        source = (raw_data or {}).get("source") or book.source
        if source in ("open_library", "google_books"):
            d["content_type"] = "buy"
        else:
            d["content_type"] = "none"
        d["content_url"] = None

    if d["content_type"] != "full":
        d["buy_links"] = _buy_links(book.title, book.author or "")

    return d


# ── GET /api/books/search?q=<query>&page=<n>&free=<bool> ───────────────────
# Empty q → returns popular public-domain books from Gutenberg
@books_bp.route("/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()
    page  = max(1, int(request.args.get("page", 1)))
    free  = request.args.get("free") == "true"

    try:
        if free:
            # Gutenberg-only: every result has full text
            results = gut_service.search_books(query or "fiction", page=page)

        elif not query:
            # No query → mix of popular OL books + some Gutenberg, shuffled
            import random
            ol_results  = ol_service.search_books("fiction", page=page)
            gut_results = gut_service.search_books("", page=page)
            combined    = ol_results + gut_results
            random.shuffle(combined)
            results = combined

        else:
            # Regular search: Open Library primary, Google Books fallback
            results = ol_service.search_books(query, page=page)
            if len(results) < 3:
                seen   = {r["title"].lower() for r in results}
                for b in gb_service.search_books(query):
                    if b["title"].lower() not in seen:
                        results.append(b)

        # Cache books and pre-create BookContent where source is known
        books_out = []
        for data in results:
            book = _upsert_book(data)
            db.session.flush()

            if not book.content:
                if data.get("source") == "gutenberg" or data.get("_gutenberg_id"):
                    # Gutenberg: full text exists — URL resolved lazily on first read
                    content = BookContent(
                        book_id=book.id,
                        content_type="full",
                        content_url=data.get("_text_url"),   # may be None
                        gutenberg_id=data.get("_gutenberg_id"),
                    )
                    db.session.add(content)
                    db.session.flush()
                    book.content = content
                elif data.get("_text_url"):
                    # Other source with a known text URL
                    content = BookContent(
                        book_id=book.id,
                        content_type="full",
                        content_url=data["_text_url"],
                    )
                    db.session.add(content)
                    db.session.flush()
                    book.content = content

            books_out.append(_book_dict_with_content(book, data))

        db.session.commit()
        return jsonify({"books": books_out, "total": len(books_out)}), 200

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Search service unavailable"}), 503


# ── GET /api/books/<external_id> ─────────────────────────────────────────────
@books_bp.route("/<path:external_id>", methods=["GET"])
def get_book(external_id):
    book = Book.query.filter_by(external_id=external_id).first()
    if not book:
        return jsonify({"error": "Book not found. Search for it first."}), 404

    try:
        if not book.content:
            content = _detect_content(book)
            db.session.add(content)
            db.session.commit()

        return jsonify({"book": _book_dict_with_content(book, None)}), 200

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Service unavailable"}), 503


def _detect_content(book):
    """Determine and return a BookContent row for the given book."""

    # 1. Already a Gutenberg book (source set at search time) — resolve text URL now
    if book.source == "gutenberg":
        ia_id    = book.external_id.replace("gut_", "")
        text_url = gut_service.get_text_url(ia_id)
        return BookContent(
            book_id=book.id,
            content_type="full" if text_url else "none",
            content_url=text_url,
            gutenberg_id=ia_id,
        )

    # 2. Try matching on Gutenberg collection via IA
    gut = gut_service.find_full_text(book.title, book.author)
    if gut:
        ia_id    = gut["gutenberg_id"]
        text_url = gut_service.get_text_url(ia_id)
        return BookContent(
            book_id=book.id,
            content_type="full" if text_url else "none",
            content_url=text_url,
            gutenberg_id=ia_id,
        )

    # 3. OL/GB books → "buy" with external links
    return BookContent(book_id=book.id, content_type="buy")


# ── GET /api/books/<external_id>/content?page=<n> ────────────────────────────
@books_bp.route("/<path:external_id>/content", methods=["GET"])
def get_content(external_id):
    book = Book.query.filter_by(external_id=external_id).first()
    if not book:
        return jsonify({"error": "Book not found"}), 404

    if not book.content or book.content.content_type != "full":
        return jsonify({"error": "Full text not available for this book"}), 404

    try:
        if not book.content.raw_text:
            # Resolve text URL lazily if not yet set (Gutenberg books from search)
            if not book.content.content_url and book.content.gutenberg_id:
                text_url = gut_service.get_text_url(book.content.gutenberg_id)
                if not text_url:
                    return jsonify({"error": "Could not locate text file for this book"}), 503
                book.content.content_url = text_url

            text = gut_service.fetch_text(book.content.content_url)
            if not text:
                text = ia_service.fetch_text(book.content.content_url)
            if not text:
                return jsonify({"error": "Failed to fetch book content"}), 503

            book.content.raw_text = _clean_gutenberg_text(text)
            db.session.commit()

        raw_text       = book.content.raw_text
        chars_per_page = 8000   # ~4 printed pages per screen page
        total_pages    = max(1, (len(raw_text) + chars_per_page - 1) // chars_per_page)
        page           = max(1, min(int(request.args.get("page", 1)), total_pages))
        start          = (page - 1) * chars_per_page
        end            = start + chars_per_page

        return jsonify({
            "text":        raw_text[start:end],
            "page":        page,
            "total_pages": total_pages,
            "has_more":    end < len(raw_text),
            "title":       book.title,
            "author":      book.author,
        }), 200

    except Exception:
        return jsonify({"error": "Service unavailable"}), 503

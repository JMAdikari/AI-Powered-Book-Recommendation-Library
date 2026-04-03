from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from ..extensions import db
from ..models import Book, BookContent
from ..services import open_library as ol_service
from ..services import google_books as gb_service
from ..services import gutenberg as gut_service

books_bp = Blueprint("books", __name__)

CACHE_TTL_HOURS = 24


def _is_stale(cached_at):
    return cached_at is None or (datetime.utcnow() - cached_at) > timedelta(hours=CACHE_TTL_HOURS)


def _upsert_book(data):
    """Find or create a Book row from normalized API data. Returns the Book instance."""
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


# ── GET /api/books/search?q=<query>&page=<n> ────────────────────────────────
@books_bp.route("/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()
    page  = max(1, int(request.args.get("page", 1)))

    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    try:
        # Primary: Open Library
        results = ol_service.search_books(query, page=page)

        # Fallback: Google Books if fewer than 3 Open Library results
        if len(results) < 3:
            gb_results = gb_service.search_books(query)
            seen_titles = {r["title"].lower() for r in results}
            for b in gb_results:
                if b["title"].lower() not in seen_titles:
                    results.append(b)

        # Cache books and build response
        books_out = []
        for data in results:
            book = _upsert_book(data)
            db.session.flush()   # ensure book.id is available
            d = book.to_dict()
            d["content_type"] = book.content.content_type if book.content else "none"
            books_out.append(d)

        db.session.commit()
        return jsonify({"books": books_out, "total": len(books_out)}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Search service unavailable"}), 503


# ── GET /api/books/<external_id> ─────────────────────────────────────────────
@books_bp.route("/<path:external_id>", methods=["GET"])
def get_book(external_id):
    book = Book.query.filter_by(external_id=external_id).first()
    if not book:
        return jsonify({"error": "Book not found. Search for it first."}), 404

    try:
        # Detect and cache content type if not already done
        if not book.content:
            gut = gut_service.find_full_text(book.title, book.author)
            if gut:
                content = BookContent(
                    book_id=book.id,
                    content_type="full",
                    content_url=gut["text_url"],
                    gutenberg_id=gut["gutenberg_id"],
                )
            else:
                # Check Google Books for preview link
                preview_url = None
                if book.source == "google_books":
                    gb_id = book.external_id.replace("gb_", "")
                    try:
                        import requests as req
                        import os
                        url    = f"https://www.googleapis.com/books/v1/volumes/{gb_id}"
                        params = {}
                        api_key = os.getenv("GOOGLE_BOOKS_API_KEY")
                        if api_key:
                            params["key"] = api_key
                        r = req.get(url, params=params, timeout=5)
                        if r.ok:
                            info = r.json().get("volumeInfo", {})
                            preview_url = info.get("previewLink")
                    except Exception:
                        pass

                content = BookContent(
                    book_id=book.id,
                    content_type="preview" if preview_url else "none",
                    content_url=preview_url,
                )
            db.session.add(content)
            db.session.commit()

        d = book.to_dict()
        d["content_type"] = book.content.content_type
        d["content_url"]  = book.content.content_url
        return jsonify({"book": d}), 200

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Service unavailable"}), 503


# ── GET /api/books/<external_id>/content?page=<n> ────────────────────────────
@books_bp.route("/<path:external_id>/content", methods=["GET"])
def get_content(external_id):
    book = Book.query.filter_by(external_id=external_id).first()
    if not book:
        return jsonify({"error": "Book not found"}), 404

    if not book.content or book.content.content_type != "full":
        return jsonify({"error": "Full text not available for this book"}), 404

    try:
        # Fetch and cache raw text from Gutenberg on first access
        if not book.content.raw_text:
            text = gut_service.fetch_text(book.content.content_url)
            if not text:
                return jsonify({"error": "Failed to fetch book content"}), 503
            book.content.raw_text = text
            db.session.commit()

        raw_text       = book.content.raw_text
        chars_per_page = 3000
        total_pages    = max(1, (len(raw_text) + chars_per_page - 1) // chars_per_page)
        page           = max(1, min(int(request.args.get("page", 1)), total_pages))
        start          = (page - 1) * chars_per_page
        end            = start + chars_per_page

        return jsonify({
            "text":        raw_text[start:end],
            "page":        page,
            "total_pages": total_pages,
            "has_more":    end < len(raw_text),
        }), 200

    except Exception:
        return jsonify({"error": "Service unavailable"}), 503

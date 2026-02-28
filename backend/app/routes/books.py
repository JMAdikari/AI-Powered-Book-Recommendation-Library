"""
Book routes.

GET  /api/books/search?q=<query>&page=1  — Search via Open Library API
GET  /api/books/:open_library_id          — Book detail (cached in DB)
GET  /api/books/:open_library_id/content  — Full text (Gutenberg, auth required)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..extensions import db
from ..models.book import Book, BookContent
from ..services.open_library import search_books, get_book_detail
from ..services.gutenberg import fetch_book_content

books_bp = Blueprint("books", __name__)


@books_bp.get("/search")
def search():
    """
    Search books via Open Library.
    Auth optional — unauthenticated users can search freely (FR1, FR7).
    """
    query = (request.args.get("q") or "").strip()
    page = int(request.args.get("page", 1))

    if len(query) < 2:
        return jsonify({"error": "Search query must be at least 2 characters."}), 400

    try:
        results = search_books(query, page=page)
    except Exception as exc:
        return jsonify({"error": "Couldn't reach the book catalogue right now. Please try again.", "detail": str(exc)}), 503

    return jsonify(results), 200


@books_bp.get("/<string:open_library_id>")
def book_detail(open_library_id: str):
    """
    Return book detail.  Cached in DB after first fetch (ADR-005).
    Auth optional.
    """
    book: Book | None = Book.query.filter_by(open_library_id=open_library_id).first()

    if not book:
        try:
            book_data = get_book_detail(open_library_id)
        except Exception as exc:
            return jsonify({"error": "Could not fetch book details.", "detail": str(exc)}), 503

        if not book_data:
            return jsonify({"error": "Book not found."}), 404

        import json
        book = Book(
            open_library_id=open_library_id,
            title=book_data.get("title", "Unknown Title"),
            author=book_data.get("author"),
            published_year=book_data.get("published_year"),
            cover_url=book_data.get("cover_url"),
            description=book_data.get("description"),
            subjects=json.dumps(book_data.get("subjects", [])),
            gutenberg_id=book_data.get("gutenberg_id"),
        )
        db.session.add(book)
        db.session.commit()

    return jsonify(book.to_dict()), 200


@books_bp.get("/<string:open_library_id>/content")
@jwt_required()
def book_content(open_library_id: str):
    """
    Return full text for in-app reading.
    Fetches from Gutenberg on first request, then serves from DB cache (NFR13).
    Requires authentication (FR17).
    """
    book: Book | None = Book.query.filter_by(open_library_id=open_library_id).first()

    if not book:
        return jsonify({"error": "Book not found."}), 404
    if not book.gutenberg_id:
        return jsonify({"error": "This book is not available for in-app reading."}), 404

    # Serve from cache if already fetched
    if book.content:
        return jsonify({"content": book.content.content, "title": book.title}), 200

    # Fetch from Gutenberg and cache
    try:
        text = fetch_book_content(book.gutenberg_id)
    except Exception as exc:
        return jsonify({"error": "Could not fetch book content.", "detail": str(exc)}), 503

    cached = BookContent(book_id=book.id, content=text)
    db.session.add(cached)
    db.session.commit()

    return jsonify({"content": text, "title": book.title}), 200

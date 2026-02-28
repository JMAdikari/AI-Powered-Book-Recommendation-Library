"""
Library (user ↔ book) routes.

GET    /api/library               — Get user's full library
POST   /api/library               — Save book to library
PATCH  /api/library/:user_book_id — Update status or is_favorite
DELETE /api/library/:user_book_id — Remove book from library
"""

import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.book import Book
from ..models.library import UserBook, ReadingProgress

library_bp = Blueprint("library", __name__)


def _current_user_id() -> int:
    return int(get_jwt_identity())


@library_bp.get("/")
@jwt_required()
def get_library():
    """Return the authenticated user's full library with progress."""
    user_id = _current_user_id()
    entries = (
        UserBook.query
        .filter_by(user_id=user_id)
        .order_by(UserBook.added_at.desc())
        .all()
    )
    return jsonify({"library": [e.to_dict() for e in entries]}), 200


@library_bp.post("/")
@jwt_required()
def save_book():
    """
    Save a book to the user's library.

    Expected JSON body:
    { "open_library_id": "OL...W" }

    Returns 201 with the new UserBook entry.
    Returns 409 if already in library.
    """
    user_id = _current_user_id()
    data = request.get_json(silent=True) or {}

    open_library_id = (data.get("open_library_id") or "").strip()
    if not open_library_id:
        return jsonify({"error": "open_library_id is required."}), 400

    book: Book | None = Book.query.filter_by(open_library_id=open_library_id).first()
    if not book:
        return jsonify({"error": "Book not found in catalogue. View the book detail page first."}), 404

    existing = UserBook.query.filter_by(user_id=user_id, book_id=book.id).first()
    if existing:
        return jsonify({"error": "Book is already in your library.", "user_book": existing.to_dict()}), 409

    entry = UserBook(user_id=user_id, book_id=book.id, status=UserBook.STATUS_SAVED)
    db.session.add(entry)
    db.session.commit()
    return jsonify({"user_book": entry.to_dict()}), 201


@library_bp.patch("/<int:user_book_id>")
@jwt_required()
def update_library_entry(user_book_id: int):
    """
    Update status or is_favorite for a library entry.

    Expected JSON body (one or both):
    { "status": "reading" | "finished" | "saved" }
    { "is_favorite": true | false }
    { "current_position": 12345, "percent_complete": 42.5 }  // progress update
    """
    user_id = _current_user_id()
    entry: UserBook | None = UserBook.query.filter_by(id=user_book_id, user_id=user_id).first()

    if not entry:
        return jsonify({"error": "Library entry not found."}), 404

    data = request.get_json(silent=True) or {}

    if "status" in data:
        new_status = data["status"]
        if new_status not in UserBook.VALID_STATUSES:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(UserBook.VALID_STATUSES)}"}), 400
        entry.status = new_status

        # Auto-set to reading when progress is provided
        if new_status == UserBook.STATUS_READING and not entry.progress:
            entry.progress = ReadingProgress(user_book_id=entry.id)

    if "is_favorite" in data:
        entry.is_favorite = bool(data["is_favorite"])

    # Update reading progress if provided
    if "current_position" in data or "percent_complete" in data:
        if not entry.progress:
            entry.progress = ReadingProgress(user_book_id=entry.id)
        if "current_position" in data:
            entry.progress.current_position = int(data["current_position"])
        if "percent_complete" in data:
            entry.progress.percent_complete = float(data["percent_complete"])

    db.session.commit()
    return jsonify({"user_book": entry.to_dict()}), 200


@library_bp.delete("/<int:user_book_id>")
@jwt_required()
def remove_book(user_book_id: int):
    """Remove a book from the user's library."""
    user_id = _current_user_id()
    entry: UserBook | None = UserBook.query.filter_by(id=user_book_id, user_id=user_id).first()

    if not entry:
        return jsonify({"error": "Library entry not found."}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Book removed from library."}), 200

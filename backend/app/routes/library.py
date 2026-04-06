from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Book, UserBook
from ..services import recommender

library_bp = Blueprint("library", __name__)


# ── GET /api/library/books?status=<>&favorites=true ─────────────────────────
@library_bp.route("/books", methods=["GET"])
@jwt_required()
def get_library():
    user_id   = int(get_jwt_identity())
    status    = request.args.get("status")
    favorites = request.args.get("favorites")

    query = UserBook.query.filter_by(user_id=user_id)
    if status in ("saved", "reading", "completed"):
        query = query.filter_by(status=status)
    if favorites == "true":
        query = query.filter_by(is_favorite=True)

    user_books = query.order_by(UserBook.added_at.desc()).all()
    return jsonify({"books": [ub.to_dict() for ub in user_books], "total": len(user_books)}), 200


# ── POST /api/library/books ──────────────────────────────────────────────────
@library_bp.route("/books", methods=["POST"])
@jwt_required()
def add_book():
    user_id     = int(get_jwt_identity())
    data        = request.get_json()
    external_id = data.get("external_id")

    if not external_id:
        return jsonify({"error": "external_id is required"}), 400

    book = Book.query.filter_by(external_id=external_id).first()
    if not book:
        return jsonify({"error": "Book not found in catalog. Search for it first."}), 404

    existing = UserBook.query.filter_by(user_id=user_id, book_id=book.id).first()
    if existing:
        return jsonify({"message": "Already in library", "id": existing.id}), 200

    user_book = UserBook(user_id=user_id, book_id=book.id, status="saved")
    db.session.add(user_book)
    db.session.commit()
    return jsonify({"message": "Saved to library", "id": user_book.id}), 201


# ── DELETE /api/library/books/<id> ───────────────────────────────────────────
@library_bp.route("/books/<int:user_book_id>", methods=["DELETE"])
@jwt_required()
def remove_book(user_book_id):
    user_id   = int(get_jwt_identity())
    user_book = UserBook.query.filter_by(id=user_book_id, user_id=user_id).first()
    if not user_book:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(user_book)
    db.session.commit()
    return jsonify({"message": "Removed from library"}), 200


# ── PUT /api/library/books/<id>/favorite ─────────────────────────────────────
@library_bp.route("/books/<int:user_book_id>/favorite", methods=["PUT"])
@jwt_required()
def toggle_favorite(user_book_id):
    user_id   = int(get_jwt_identity())
    user_book = UserBook.query.filter_by(id=user_book_id, user_id=user_id).first()
    if not user_book:
        return jsonify({"error": "Not found"}), 404

    user_book.is_favorite = not user_book.is_favorite
    db.session.commit()
    return jsonify({"message": "Updated", "is_favorite": user_book.is_favorite}), 200


# ── PUT /api/library/books/<id>/status ───────────────────────────────────────
@library_bp.route("/books/<int:user_book_id>/status", methods=["PUT"])
@jwt_required()
def update_status(user_book_id):
    user_id = int(get_jwt_identity())
    data    = request.get_json()
    status  = data.get("status")

    if status not in ("saved", "reading", "completed"):
        return jsonify({"error": "Status must be 'saved', 'reading', or 'completed'"}), 400

    user_book = UserBook.query.filter_by(id=user_book_id, user_id=user_id).first()
    if not user_book:
        return jsonify({"error": "Not found"}), 404

    user_book.status = status
    db.session.commit()

    # Step 24 — Progress-Triggered Recommendation Refresh
    # When a book is completed, recs are re-scored on the next dashboard visit
    # (get_recommendations() runs fresh each time). Signal this to the frontend.
    recs_refreshed = status == "completed"

    return jsonify({
        "message":      "Status updated",
        "status":       status,
        "recs_refreshed": recs_refreshed,
    }), 200

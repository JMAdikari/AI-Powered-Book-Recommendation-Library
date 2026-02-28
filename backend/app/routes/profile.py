"""
Profile routes.

GET   /api/profile                   — Get authenticated user's profile + stats
PATCH /api/profile/preferences       — Update genre/mood preferences
"""

import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.user import User, UserPreference
from ..models.library import UserBook

profile_bp = Blueprint("profile", __name__)


def _current_user_id() -> int:
    return int(get_jwt_identity())


@profile_bp.get("/")
@jwt_required()
def get_profile():
    """
    Return user profile including reading stats.

    Response:
    {
        "user": { id, email, created_at },
        "preferences": { genres, mood, reference_book },
        "stats": {
            "total_saved": int,
            "total_reading": int,
            "total_finished": int,
            "total_favorites": int
        }
    }
    """
    user_id = _current_user_id()
    user: User | None = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found."}), 404

    library_entries = UserBook.query.filter_by(user_id=user_id).all()
    stats = {
        "total_saved": sum(1 for e in library_entries if e.status == UserBook.STATUS_SAVED),
        "total_reading": sum(1 for e in library_entries if e.status == UserBook.STATUS_READING),
        "total_finished": sum(1 for e in library_entries if e.status == UserBook.STATUS_FINISHED),
        "total_favorites": sum(1 for e in library_entries if e.is_favorite),
    }

    return jsonify({
        "user": user.to_dict(),
        "preferences": user.preference.to_dict() if user.preference else {},
        "stats": stats,
    }), 200


@profile_bp.patch("/preferences")
@jwt_required()
def update_preferences():
    """
    Update user genre/mood preferences.

    Expected JSON body (partial updates allowed):
    {
        "genres": ["Adventure", "Mystery"],
        "mood": "Escape into another world",
        "reference_book": "Treasure Island"  // optional
    }
    """
    user_id = _current_user_id()
    data = request.get_json(silent=True) or {}

    user: User | None = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    if not user.preference:
        user.preference = UserPreference(user_id=user_id)
        db.session.add(user.preference)

    if "genres" in data:
        genres = data["genres"]
        if not isinstance(genres, list) or len(genres) == 0:
            return jsonify({"error": "genres must be a non-empty list."}), 400
        user.preference.genres = json.dumps(genres)

    if "mood" in data:
        user.preference.mood = str(data["mood"])

    if "reference_book" in data:
        user.preference.reference_book = data["reference_book"] or None

    db.session.commit()
    return jsonify({"preferences": user.preference.to_dict()}), 200

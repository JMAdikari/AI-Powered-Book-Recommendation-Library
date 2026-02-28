"""
Recommendation routes.

GET /api/recommendations?limit=10 — Return personalised book recommendations (auth required)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User, UserPreference
from ..models.library import UserBook
from ..models.book import Book
from ..services.recommender import get_recommendations

recommendations_bp = Blueprint("recommendations", __name__)


@recommendations_bp.get("/")
@jwt_required()
def recommendations():
    """
    Return personalised recommendations for the authenticated user.

    Query params:
      limit (int, default 10) — number of recommendations to return

    Response:
    {
        "recommendations": [ <book dicts> ],
        "profile_quality": "cold_start" | "low" | "medium" | "high"
    }
    """
    user_id = int(get_jwt_identity())
    limit = min(int(request.args.get("limit", 10)), 50)

    user: User | None = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Gather user's library entries (for filtering + weighting)
    library_entries = UserBook.query.filter_by(user_id=user_id).all()

    # Determine profile quality signal for UI nudge (FR28, dashboard nudge)
    finished_count = sum(1 for e in library_entries if e.status == UserBook.STATUS_FINISHED)
    if finished_count == 0:
        profile_quality = "cold_start"
    elif finished_count < 2:
        profile_quality = "low"
    elif finished_count < 5:
        profile_quality = "medium"
    else:
        profile_quality = "high"

    try:
        recs = get_recommendations(user=user, library_entries=library_entries, limit=limit)
    except Exception as exc:
        return jsonify({"error": "Could not generate recommendations.", "detail": str(exc)}), 500

    return jsonify({"recommendations": recs, "profile_quality": profile_quality}), 200

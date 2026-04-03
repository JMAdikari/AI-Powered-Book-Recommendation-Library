from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services import recommender
from ..models import BookContent

rec_bp = Blueprint("recommendations", __name__)


def _serialize(rec):
    """Convert a recommender result dict into a JSON-safe dict."""
    book = rec["book"]

    # Get content type from DB (already cached from search/detail visits)
    content_type = "none"
    buy_links    = {}
    if book.content:
        content_type = book.content.content_type
    else:
        # Books from OL/GB not yet detail-visited — assume buy
        if book.source in ("open_library", "google_books"):
            content_type = "buy"

    if content_type != "full":
        import urllib.parse
        q = urllib.parse.quote_plus(f"{book.title} {book.author or ''}".strip())
        buy_links = {
            "open_library": f"https://openlibrary.org/search?q={q}",
            "google_books": f"https://books.google.com/books?q={q}",
            "amazon":       f"https://www.amazon.com/s?k={q}&i=stripbooks",
        }

    return {
        "book": {
            **book.to_dict(),
            "content_type": content_type,
            "buy_links":    buy_links,
        },
        "score":       rec["score"],
        "reason":      rec["reason"],
        "reason_type": rec["reason_type"],
    }


# ── GET /api/recommendations ─────────────────────────────────────────────────
@rec_bp.route("", methods=["GET"])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    try:
        recs = recommender.get_recommendations(user_id, n=10)
        return jsonify({
            "recommendations": [_serialize(r) for r in recs],
            "total":           len(recs),
            "source":          "cold_start" if all(r["reason_type"] in ("cold_start", "genre_preference") for r in recs) else "behavioral",
        }), 200
    except Exception as e:
        return jsonify({"error": "Recommendation service unavailable"}), 503


# ── POST /api/recommendations/refresh ────────────────────────────────────────
@rec_bp.route("/refresh", methods=["POST"])
@jwt_required()
def refresh_recommendations():
    user_id = int(get_jwt_identity())
    try:
        recommender.build_matrix()
        recs = recommender.get_recommendations(user_id, n=10)
        return jsonify({
            "recommendations": [_serialize(r) for r in recs],
            "total":           len(recs),
            "source":          "refreshed",
        }), 200
    except Exception:
        return jsonify({"error": "Refresh failed"}), 503

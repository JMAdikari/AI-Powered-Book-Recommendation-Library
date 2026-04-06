from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..extensions import db
from ..models import UserBook, ReadingProgress

progress_bp = Blueprint("progress", __name__)


@progress_bp.route("/weekly", methods=["GET"])
@jwt_required()
def weekly_progress():
    user_id  = int(get_jwt_identity())
    now      = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    today    = now.date()

    # All ReadingProgress rows for this user
    all_progress = (
        db.session.query(ReadingProgress)
        .join(UserBook, ReadingProgress.user_book_id == UserBook.id)
        .filter(UserBook.user_id == user_id)
        .all()
    )

    # Books & pages active this week
    active_this_week = [
        p for p in all_progress
        if p.last_read_at and p.last_read_at >= week_ago
    ]
    books_this_week = len(active_this_week)
    pages_this_week = sum(p.current_page for p in active_this_week if p.current_page)

    # Unique read dates across all reading history
    read_dates = set()
    for p in all_progress:
        if p.last_read_at:
            read_dates.add(p.last_read_at.date())

    # Streak: consecutive days ending today (or yesterday)
    streak     = 0
    check_date = today if today in read_dates else today - timedelta(days=1)
    while check_date in read_dates:
        streak    += 1
        check_date -= timedelta(days=1)

    # 7-day activity map  { "YYYY-MM-DD": bool }
    daily_activity = {}
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        daily_activity[d.isoformat()] = d in read_dates

    # Lifetime totals
    total_completed = UserBook.query.filter_by(user_id=user_id, status="completed").count()
    total_saved     = UserBook.query.filter_by(user_id=user_id).count()
    total_favorites = UserBook.query.filter_by(user_id=user_id, is_favorite=True).count()

    return jsonify({
        "books_this_week":  books_this_week,
        "pages_this_week":  pages_this_week,
        "streak_days":      streak,
        "daily_activity":   daily_activity,
        "total_completed":  total_completed,
        "total_saved":      total_saved,
        "total_favorites":  total_favorites,
    }), 200

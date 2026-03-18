from ..extensions import db
from datetime import datetime


class UserPreference(db.Model):
    __tablename__ = "user_preferences"

    id                 = db.Column(db.Integer, primary_key=True)
    user_id            = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    genres             = db.Column(db.JSON, default=list)
    favorite_authors   = db.Column(db.JSON, default=list)
    preferred_language = db.Column(db.String(10), default="en")
    updated_at         = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="preference")

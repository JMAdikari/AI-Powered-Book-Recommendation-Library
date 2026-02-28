"""
User and UserPreference models.

Schema (from architecture.md):
    users              — id, email, password_hash, created_at
    user_preferences   — id, user_id, genres (JSON list), mood, reference_book, updated_at
"""

from datetime import datetime, timezone
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id: int = db.Column(db.Integer, primary_key=True)
    email: str = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash: str = db.Column(db.String(255), nullable=False)
    created_at: datetime = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    preference = db.relationship(
        "UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    library_entries = db.relationship(
        "UserBook", back_populates="user", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {"id": self.id, "email": self.email, "created_at": self.created_at.isoformat()}

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"


class UserPreference(db.Model):
    __tablename__ = "user_preferences"

    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)

    # Onboarding data
    genres: str = db.Column(db.Text, nullable=True)           # JSON-encoded list e.g. '["Adventure","Mystery"]'
    mood: str = db.Column(db.String(100), nullable=True)       # e.g. "Escape into another world"
    reference_book: str = db.Column(db.String(255), nullable=True)  # Optional free-text book title

    updated_at: datetime = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = db.relationship("User", back_populates="preference")

    def to_dict(self) -> dict:
        import json
        return {
            "genres": json.loads(self.genres) if self.genres else [],
            "mood": self.mood,
            "reference_book": self.reference_book,
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<UserPreference user_id={self.user_id}>"

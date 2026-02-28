"""
UserBook and ReadingProgress models.

Schema (from architecture.md):
    user_books        — id, user_id, book_id, status, is_favorite, added_at
                        UNIQUE(user_id, book_id)
                        status: 'saved' | 'reading' | 'finished'
    reading_progress  — id, user_book_id, current_position (int chars), 
                        percent_complete (float), last_read_at
"""

from datetime import datetime, timezone
from ..extensions import db


class UserBook(db.Model):
    """Junction table tracking a user's relationship with a book."""

    __tablename__ = "user_books"
    __table_args__ = (db.UniqueConstraint("user_id", "book_id", name="uq_user_book"),)

    STATUS_SAVED = "saved"
    STATUS_READING = "reading"
    STATUS_FINISHED = "finished"
    VALID_STATUSES = {STATUS_SAVED, STATUS_READING, STATUS_FINISHED}

    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    book_id: int = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False, index=True)
    status: str = db.Column(db.String(20), nullable=False, default=STATUS_SAVED)
    is_favorite: bool = db.Column(db.Boolean, nullable=False, default=False)
    added_at: datetime = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = db.relationship("User", back_populates="library_entries")
    book = db.relationship("Book", back_populates="library_entries")
    progress = db.relationship(
        "ReadingProgress",
        back_populates="user_book",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def to_dict(self) -> dict:
        result = {
            "user_book_id": self.id,
            "status": self.status,
            "is_favorite": self.is_favorite,
            "added_at": self.added_at.isoformat(),
            "book": self.book.to_dict() if self.book else None,
        }
        if self.progress:
            result["progress"] = self.progress.to_dict()
        return result

    def __repr__(self) -> str:
        return f"<UserBook user={self.user_id} book={self.book_id} status={self.status}>"


class ReadingProgress(db.Model):
    """Tracks how far through a book a user has read."""

    __tablename__ = "reading_progress"

    id: int = db.Column(db.Integer, primary_key=True)
    user_book_id: int = db.Column(
        db.Integer, db.ForeignKey("user_books.id"), nullable=False, unique=True
    )
    current_position: int = db.Column(db.Integer, nullable=False, default=0)  # character offset
    percent_complete: float = db.Column(db.Float, nullable=False, default=0.0)
    last_read_at: datetime = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user_book = db.relationship("UserBook", back_populates="progress")

    def to_dict(self) -> dict:
        return {
            "current_position": self.current_position,
            "percent_complete": round(self.percent_complete, 1),
            "last_read_at": self.last_read_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<ReadingProgress user_book={self.user_book_id} {self.percent_complete:.0f}%>"

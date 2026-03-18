from ..extensions import db
from datetime import datetime


class ReadingProgress(db.Model):
    __tablename__ = "reading_progress"

    id           = db.Column(db.Integer, primary_key=True)
    user_book_id = db.Column(db.Integer, db.ForeignKey("user_books.id"), nullable=False, unique=True)
    current_page = db.Column(db.Integer, default=0)
    total_pages  = db.Column(db.Integer, default=0)
    last_read_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_book = db.relationship("UserBook", back_populates="progress")

    def to_dict(self):
        return {
            "current_page": self.current_page,
            "total_pages":  self.total_pages,
            "last_read_at": self.last_read_at.isoformat() if self.last_read_at else None,
            "percent":      round((self.current_page / self.total_pages) * 100)
                            if self.total_pages else 0,
        }

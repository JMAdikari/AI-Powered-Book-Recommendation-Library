from ..extensions import db
from datetime import datetime


class UserBook(db.Model):
    __tablename__ = "user_books"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id     = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    status      = db.Column(db.String(20), default="saved")  # "saved" | "reading" | "completed"
    is_favorite = db.Column(db.Boolean, default=False)
    added_at    = db.Column(db.DateTime, default=datetime.utcnow)

    user     = db.relationship("User", back_populates="books")
    book     = db.relationship("Book", back_populates="user_books")
    progress = db.relationship("ReadingProgress", back_populates="user_book", uselist=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "book_id", name="uq_user_book"),
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "book":        self.book.to_dict() if self.book else None,
            "status":      self.status,
            "is_favorite": self.is_favorite,
            "added_at":    self.added_at.isoformat(),
        }

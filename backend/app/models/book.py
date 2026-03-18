from ..extensions import db
from datetime import datetime


class Book(db.Model):
    __tablename__ = "books"

    id          = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(100), unique=True, nullable=False)
    source      = db.Column(db.String(30), nullable=False)   # "open_library" | "google_books"
    title       = db.Column(db.String(300), nullable=False)
    author      = db.Column(db.String(200))
    genres      = db.Column(db.JSON, default=list)
    description = db.Column(db.Text)
    cover_url   = db.Column(db.String(500))
    cached_at   = db.Column(db.DateTime, default=datetime.utcnow)

    content    = db.relationship("BookContent", back_populates="book", uselist=False)
    user_books = db.relationship("UserBook", back_populates="book")

    def to_dict(self):
        return {
            "id":          self.id,
            "external_id": self.external_id,
            "source":      self.source,
            "title":       self.title,
            "author":      self.author,
            "genres":      self.genres or [],
            "description": self.description,
            "cover_url":   self.cover_url,
        }

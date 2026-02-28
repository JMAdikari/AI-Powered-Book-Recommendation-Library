"""
Book and BookContent models.

Schema (from architecture.md):
    books         — id, open_library_id, title, author, published_year, 
                    cover_url, description, subjects (JSON), gutenberg_id, cached_at
    book_content  — id, book_id (FK), content (TEXT), fetched_at
"""

from datetime import datetime, timezone
from ..extensions import db


class Book(db.Model):
    __tablename__ = "books"

    id: int = db.Column(db.Integer, primary_key=True)
    open_library_id: str = db.Column(db.String(50), unique=True, nullable=False, index=True)
    title: str = db.Column(db.String(500), nullable=False)
    author: str = db.Column(db.String(500), nullable=True)
    published_year: int = db.Column(db.Integer, nullable=True)
    cover_url: str = db.Column(db.String(500), nullable=True)
    description: str = db.Column(db.Text, nullable=True)
    subjects: str = db.Column(db.Text, nullable=True)     # JSON-encoded list of subject strings
    gutenberg_id: int = db.Column(db.Integer, nullable=True)  # Project Gutenberg book ID if available
    cached_at: datetime = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    content = db.relationship(
        "BookContent", back_populates="book", uselist=False, cascade="all, delete-orphan"
    )
    library_entries = db.relationship(
        "UserBook", back_populates="book", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        import json
        return {
            "id": self.open_library_id,
            "title": self.title,
            "author": self.author,
            "published_year": self.published_year,
            "cover_url": self.cover_url,
            "description": self.description,
            "subjects": json.loads(self.subjects) if self.subjects else [],
            "is_readable": self.gutenberg_id is not None,
        }

    def __repr__(self) -> str:
        return f"<Book id={self.open_library_id} title={self.title!r}>"


class BookContent(db.Model):
    """Cached full-text content fetched from Project Gutenberg (ADR-005)."""

    __tablename__ = "book_content"

    id: int = db.Column(db.Integer, primary_key=True)
    book_id: int = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False, unique=True)
    content: str = db.Column(db.Text, nullable=False)   # Full plain-text of the book
    fetched_at: datetime = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    book = db.relationship("Book", back_populates="content")

    def __repr__(self) -> str:
        return f"<BookContent book_id={self.book_id}>"

from ..extensions import db


class BookContent(db.Model):
    __tablename__ = "book_contents"

    id           = db.Column(db.Integer, primary_key=True)
    book_id      = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False, unique=True)
    content_type = db.Column(db.String(20), default="none")  # "full" | "preview" | "none"
    content_url  = db.Column(db.String(500))
    raw_text     = db.Column(db.Text)
    gutenberg_id = db.Column(db.String(50))

    book = db.relationship("Book", back_populates="content")

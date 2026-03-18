import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ..models import Book

CACHE_DIR  = "ml_cache"
CACHE_FILE = os.path.join(CACHE_DIR, "tfidf_matrix.pkl")

_vectorizer  = None
_tfidf_matrix = None
_book_ids    = []


def _build_corpus(books):
    corpus = []
    for book in books:
        genres = " ".join(book.genres or [])
        text   = f"{book.title} {book.description or ''} {genres}"
        corpus.append(text)
    return corpus


def build_matrix():
    global _vectorizer, _tfidf_matrix, _book_ids

    books  = Book.query.all()
    if not books:
        return

    corpus      = _build_corpus(books)
    _book_ids   = [b.id for b in books]
    _vectorizer = TfidfVectorizer(stop_words="english", max_features=5000, ngram_range=(1, 2))
    _tfidf_matrix = _vectorizer.fit_transform(corpus)

    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "wb") as f:
        pickle.dump((_vectorizer, _tfidf_matrix, _book_ids), f)


def load_matrix():
    global _vectorizer, _tfidf_matrix, _book_ids

    if _tfidf_matrix is not None:
        return True

    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "rb") as f:
            _vectorizer, _tfidf_matrix, _book_ids = pickle.load(f)
        return True

    return False


def get_similar_books(book_id, n=10):
    if not load_matrix():
        build_matrix()
        if _tfidf_matrix is None:
            return []

    if book_id not in _book_ids:
        return []

    idx        = _book_ids.index(book_id)
    sim_scores = cosine_similarity(_tfidf_matrix[idx], _tfidf_matrix).flatten()
    sim_scores[idx] = 0  # exclude self

    top_indices = sim_scores.argsort()[::-1][:n]
    return [
        {"book_id": _book_ids[i], "score": float(sim_scores[i])}
        for i in top_indices
        if sim_scores[i] > 0
    ]

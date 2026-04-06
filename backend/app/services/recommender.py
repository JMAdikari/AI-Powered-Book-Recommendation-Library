"""
TF-IDF + Cosine Similarity Recommendation Engine
See: bmad/PHASE5_AI_RECOMMENDATION.md for full algorithm documentation
"""
import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ..models import Book, UserBook, UserPreference

CACHE_DIR  = os.path.join(os.path.dirname(__file__), "..", "..", "ml_cache")
CACHE_FILE = os.path.join(CACHE_DIR, "tfidf_matrix.pkl")

# In-memory cache — persists for the lifetime of the Flask process
_vectorizer   = None
_tfidf_matrix = None
_book_ids     = []   # parallel list: _book_ids[i] = DB id of row i in _tfidf_matrix

# Behavioral weights — how much each user action counts toward their interest vector
BEHAVIOR_WEIGHTS = {
    "completed": 1.0,
    "reading":   0.6,
    "saved":     0.3,
}
FAVORITE_BONUS  = 0.9   # added on top of status weight when is_favorite=True


# ── Matrix management ────────────────────────────────────────────────────────

def _corpus_string(book):
    genres = " ".join(book.genres or [])
    # Repeat title/genres to give them higher TF weight
    return f"{book.title} {book.title} {book.author or ''} {book.description or ''} {genres} {genres}"


def build_matrix():
    """Build TF-IDF matrix from all books in the DB and persist to disk."""
    global _vectorizer, _tfidf_matrix, _book_ids

    books = Book.query.all()
    if not books:
        return False

    corpus      = [_corpus_string(b) for b in books]
    _book_ids   = [b.id for b in books]
    _vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=5000,
        ngram_range=(1, 2),
        min_df=1,
    )
    _tfidf_matrix = _vectorizer.fit_transform(corpus)

    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "wb") as f:
        pickle.dump((_vectorizer, _tfidf_matrix, _book_ids), f)

    return True


def load_matrix():
    """Load matrix from memory cache or disk. Build if neither exists."""
    global _vectorizer, _tfidf_matrix, _book_ids

    if _tfidf_matrix is not None:
        return True

    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "rb") as f:
                _vectorizer, _tfidf_matrix, _book_ids = pickle.load(f)
            return True
        except Exception:
            pass

    return build_matrix()


def should_rebuild(db_book_count):
    """Return True if catalog has grown >20% since last matrix build."""
    if _book_ids is None or len(_book_ids) == 0:
        return True
    return db_book_count > len(_book_ids) * 1.2


# ── Core recommendation logic ─────────────────────────────────────────────────

def get_recommendations(user_id, n=10):
    """
    Return top-n recommendations for a user as a list of dicts:
      [{ book, score, reason, reason_type }]

    Falls back to cold-start if no behavioral data exists.
    """
    if not load_matrix():
        return []

    # Check if rebuild is needed
    total_books = Book.query.count()
    if should_rebuild(total_books):
        build_matrix()
        if _tfidf_matrix is None:
            return []

    user_books = UserBook.query.filter_by(user_id=user_id).all()
    seen_book_ids = {ub.book_id for ub in user_books}

    if not user_books:
        # ── Cold-start path ──
        return _cold_start_recommendations(user_id, seen_book_ids, n)

    # ── Behavioral path ──
    return _behavioral_recommendations(user_id, user_books, seen_book_ids, n)


def _behavioral_recommendations(user_id, user_books, seen_book_ids, n):
    """Build a weighted user interest vector from their reading history."""
    global _tfidf_matrix, _book_ids

    # Build weighted user interest vector
    user_vector  = None
    book_weights = {}   # book_id → weight (for reason generation)

    for ub in user_books:
        if ub.book_id not in _book_ids:
            continue
        idx    = _book_ids.index(ub.book_id)
        weight = BEHAVIOR_WEIGHTS.get(ub.status, 0.1)
        if ub.is_favorite:
            weight += FAVORITE_BONUS

        book_vec = _tfidf_matrix[idx]
        book_weights[ub.book_id] = weight

        if user_vector is None:
            user_vector = book_vec * weight
        else:
            user_vector = user_vector + book_vec * weight

    if user_vector is None:
        return _cold_start_recommendations(user_id, seen_book_ids, n)

    # Normalize
    norm = np.sqrt(user_vector.multiply(user_vector).sum())
    if norm > 0:
        user_vector = user_vector / norm

    # Score all books
    raw_scores = cosine_similarity(user_vector, _tfidf_matrix).flatten()

    # Load preference genres for bonus
    pref = UserPreference.query.filter_by(user_id=user_id).first()
    pref_genres  = [g.lower() for g in (pref.genres if pref else [])]
    pref_authors = [a.lower() for a in (pref.favorite_authors if pref else [])]

    # Get top-weighted book for reason label
    top_book_id  = max(book_weights, key=book_weights.get) if book_weights else None
    top_book_obj = Book.query.get(top_book_id) if top_book_id else None

    results = []
    for i, score in enumerate(raw_scores):
        bid = _book_ids[i]
        if bid in seen_book_ids:
            continue

        book = Book.query.get(bid)
        if not book:
            continue

        # Bonus scoring
        final_score = float(score) * 0.7
        reason, reason_type = _generate_reason(
            book, top_book_obj, pref_genres, pref_authors, score
        )
        # Author match bonus
        if top_book_obj and book.author and top_book_obj.author:
            if book.author.lower() == top_book_obj.author.lower():
                final_score += 0.10
                reason      = f"More by {book.author}"
                reason_type = "author_match"
        # Genre preference bonus
        book_genres = [g.lower() for g in (book.genres or [])]
        if any(g in book_genres for g in pref_genres):
            final_score += 0.05

        results.append({
            "book":        book,
            "score":       round(final_score, 4),
            "reason":      reason,
            "reason_type": reason_type,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:n]


def _cold_start_recommendations(user_id, seen_book_ids, n):
    """
    Cold-start: use stated genre/author preferences to seed recommendations.
    Falls back to most-downloaded books in catalog.
    """
    global _tfidf_matrix, _book_ids

    pref = UserPreference.query.filter_by(user_id=user_id).first()

    seed_books = []
    reason_label = "Popular pick"
    reason_type  = "cold_start"

    if pref and pref.genres:
        genre = pref.genres[0]
        reason_label = f"Based on your interest in {genre}"
        reason_type  = "genre_preference"
        # Find books in catalog matching this genre
        all_books = Book.query.all()
        for b in all_books:
            if b.id in seen_book_ids:
                continue
            if any(genre.lower() in g.lower() for g in (b.genres or [])):
                seed_books.append(b)
                if len(seed_books) >= 5:
                    break

    if not seed_books:
        # No genre match — return first n unseen books from catalog
        all_books = Book.query.limit(n + 20).all()
        return [
            {
                "book":        b,
                "score":       0.5,
                "reason":      "Popular in our catalog",
                "reason_type": "cold_start",
            }
            for b in all_books if b.id not in seen_book_ids
        ][:n]

    # Build seed vector from genre-matched books
    seed_vector = None
    for b in seed_books:
        if b.id not in _book_ids:
            continue
        idx = _book_ids.index(b.id)
        v   = _tfidf_matrix[idx]
        seed_vector = v if seed_vector is None else seed_vector + v

    if seed_vector is None:
        return []

    raw_scores = cosine_similarity(seed_vector, _tfidf_matrix).flatten()
    results    = []

    for i, score in enumerate(raw_scores):
        bid = _book_ids[i]
        if bid in seen_book_ids:
            continue
        book = Book.query.get(bid)
        if not book:
            continue
        results.append({
            "book":        book,
            "score":       round(float(score), 4),
            "reason":      reason_label,
            "reason_type": reason_type,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:n]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_reason(book, top_book, pref_genres, pref_authors, score):
    if top_book and score > 0.1:
        return f"Because you read {top_book.title}", "behavioral"
    if pref_genres:
        book_genres = [g.lower() for g in (book.genres or [])]
        for pg in pref_genres:
            if pg in book_genres:
                return f"Based on your interest in {pg.title()}", "genre_preference"
    if pref_authors:
        if book.author and any(a in book.author.lower() for a in pref_authors):
            return f"By your favourite author", "author_match"
    return "Recommended for you", "general"

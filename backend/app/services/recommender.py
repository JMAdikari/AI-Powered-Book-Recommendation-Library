"""
TF-IDF content-based recommendation engine (ADR-004).

Algorithm:
  1. Build corpus from all books in DB (title + description + subjects)
  2. Fit TF-IDF vectorizer → book_matrix (n_books × n_terms)
  3. Build user_vector: weighted avg of TF-IDF vectors from user's history
       Weights: finished=3.0, favorite=2.0, reading=1.5, saved=1.0, onboarding_genre=0.5
  4. Cosine similarity(user_vector, book_matrix) → similarity scores
  5. Filter out books already in user's library
  6. Return top-N books (minimum threshold: 0.10)

Performance target: < 2 seconds for corpus of ~5,000 books (NFR1, FR30)
"""

import json
import logging
from typing import Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# Weights for each signal type (ADR-004)
WEIGHT_FINISHED = 3.0
WEIGHT_FAVORITE = 2.0
WEIGHT_READING = 1.5
WEIGHT_SAVED = 1.0
WEIGHT_ONBOARDING_GENRE = 0.5

# Minimum similarity score to include a recommendation
MIN_SIMILARITY_THRESHOLD = 0.10


def _book_to_text(book) -> str:
    """Concatenate book fields into a single text string for TF-IDF."""
    parts = [book.title or ""]
    if book.description:
        parts.append(book.description)
    if book.subjects:
        try:
            subjects = json.loads(book.subjects)
            parts.extend(subjects)
        except (json.JSONDecodeError, TypeError):
            pass
    return " ".join(parts)


def get_recommendations(user, library_entries: list, limit: int = 10) -> list[dict]:
    """
    Generate personalised book recommendations for `user`.

    Args:
        user:             User model instance (has .preference relationship)
        library_entries:  List of UserBook entries for this user
        limit:            Max number of recommendations to return

    Returns:
        List of book dicts (same shape as Book.to_dict())
    """
    from ..models.book import Book
    from ..models.library import UserBook

    # Fetch all books in DB for the corpus
    all_books = Book.query.all()
    if not all_books:
        logger.info("Recommender: no books in DB — returning empty list")
        return []

    # Build corpus
    corpus = [_book_to_text(b) for b in all_books]
    book_ids_in_corpus = [b.id for b in all_books]

    # IDs of books already in user's library (to exclude from recommendations)
    user_book_ids = {entry.book_id for entry in library_entries}

    # --- Fit TF-IDF ---
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=10_000,
        ngram_range=(1, 2),
        min_df=1,
    )
    book_matrix = vectorizer.fit_transform(corpus)  # shape (n_books, n_terms)

    # --- Build user vector ---
    weighted_vectors = []
    total_weight = 0.0

    # Map book_id → index in corpus
    book_id_to_idx = {b.id: i for i, b in enumerate(all_books)}

    for entry in library_entries:
        idx = book_id_to_idx.get(entry.book_id)
        if idx is None:
            continue

        # Determine weight
        if entry.status == UserBook.STATUS_FINISHED:
            weight = WEIGHT_FINISHED
        elif entry.is_favorite:
            weight = WEIGHT_FAVORITE
        elif entry.status == UserBook.STATUS_READING:
            weight = WEIGHT_READING
        else:
            weight = WEIGHT_SAVED

        book_vec = book_matrix[idx].toarray().flatten()
        weighted_vectors.append(book_vec * weight)
        total_weight += weight

    # Add onboarding genre signal if available
    if user.preference and user.preference.genres:
        try:
            genres = json.loads(user.preference.genres)
            genre_text = " ".join(genres)
            genre_vec = vectorizer.transform([genre_text]).toarray().flatten()
            weighted_vectors.append(genre_vec * WEIGHT_ONBOARDING_GENRE)
            total_weight += WEIGHT_ONBOARDING_GENRE
        except Exception as exc:
            logger.warning("Failed to process onboarding genres: %s", exc)

    if not weighted_vectors or total_weight == 0:
        # Cold start: return newest books not in library
        logger.info("Recommender: cold start — returning newest books for user %s", user.id)
        cold_books = [
            b for b in sorted(all_books, key=lambda x: x.id, reverse=True)
            if b.id not in user_book_ids
        ][:limit]
        return [b.to_dict() for b in cold_books]

    user_vector = np.sum(weighted_vectors, axis=0) / total_weight  # shape (n_terms,)
    user_vector = user_vector.reshape(1, -1)

    # --- Compute cosine similarity ---
    similarities = cosine_similarity(user_vector, book_matrix).flatten()  # shape (n_books,)

    # Build (score, book) pairs, exclude user's library and apply threshold
    scored = [
        (float(similarities[i]), all_books[i])
        for i in range(len(all_books))
        if book_ids_in_corpus[i] not in user_book_ids
        and float(similarities[i]) >= MIN_SIMILARITY_THRESHOLD
    ]

    # Sort descending by score
    scored.sort(key=lambda x: x[0], reverse=True)

    top_books = [book.to_dict() for _, book in scored[:limit]]

    # If we didn't hit the threshold for enough books, pad with newest
    if len(top_books) < limit:
        existing_ids = {b["id"] for b in top_books}
        padding = [
            b.to_dict()
            for b in sorted(all_books, key=lambda x: x.id, reverse=True)
            if b.id not in user_book_ids and b.open_library_id not in existing_ids
        ][: limit - len(top_books)]
        top_books.extend(padding)

    logger.info("Recommender: returning %d recommendations for user %s", len(top_books), user.id)
    return top_books

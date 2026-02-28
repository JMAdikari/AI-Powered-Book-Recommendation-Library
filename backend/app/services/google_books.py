"""
Google Books API client — fallback for cover images and descriptions (ADR-005).

Used only when Open Library lacks cover or description data.
API key loaded from environment variable GOOGLE_BOOKS_API_KEY.
"""

import logging
import os
from typing import Optional
import requests

logger = logging.getLogger(__name__)

GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1/volumes"
TIMEOUT = 6


def get_google_book_metadata(isbn_or_title: str) -> Optional[dict]:
    """
    Search Google Books for a specific ISBN or title string.

    Returns a dict with keys: cover_url, description, or None on failure.
    Used as a fallback only — Open Library is the primary source (ADR-005).
    """
    api_key = os.environ.get("GOOGLE_BOOKS_API_KEY", "")
    if not api_key:
        logger.debug("GOOGLE_BOOKS_API_KEY not set — skipping Google Books fallback")
        return None

    params = {"q": isbn_or_title, "maxResults": 1, "key": api_key}
    try:
        resp = requests.get(GOOGLE_BOOKS_BASE, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.warning("Google Books API request failed: %s", exc)
        return None

    items = data.get("items")
    if not items:
        return None

    volume_info = items[0].get("volumeInfo", {})
    image_links = volume_info.get("imageLinks", {})

    return {
        "cover_url": image_links.get("thumbnail") or image_links.get("smallThumbnail"),
        "description": volume_info.get("description"),
    }

"""
Open Library API client (ADR-005).

Responsibilities:
  - search_books(query, page)  → list of book dicts (search results)
  - get_book_detail(open_library_id) → single book dict

Base URL: https://openlibrary.org
Retry logic: up to 2 retries with exponential backoff (NFR12)
No caching on search results (search queries vary); detail cached at DB level.
"""

import time
import logging
from typing import Optional
import requests

logger = logging.getLogger(__name__)

OPEN_LIBRARY_BASE = "https://openlibrary.org"
OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org/b/id"
MAX_RETRIES = 2
TIMEOUT = 8  # seconds


def _get_with_retry(url: str, params: dict | None = None) -> requests.Response:
    """GET request with exponential backoff retry (NFR12)."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(url, params=params, timeout=TIMEOUT)
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            if attempt == MAX_RETRIES:
                raise
            wait = 2 ** attempt  # 1s, 2s
            logger.warning("Open Library request failed (attempt %d/%d): %s — retrying in %ds", attempt + 1, MAX_RETRIES + 1, exc, wait)
            time.sleep(wait)


def _cover_url(cover_id: int | None) -> str | None:
    if not cover_id:
        return None
    return f"{OPEN_LIBRARY_COVERS}/{cover_id}-M.jpg"


def search_books(query: str, page: int = 1, limit: int = 20) -> dict:
    """
    Search Open Library and return a normalised list of book dicts.

    Returns:
    {
        "results": [ { id, title, author, published_year, cover_url } ],
        "total": int,
        "page": int
    }
    """
    offset = (page - 1) * limit
    params = {
        "q": query,
        "limit": limit,
        "offset": offset,
        "fields": "key,title,author_name,first_publish_year,cover_i,subject",
    }
    resp = _get_with_retry(f"{OPEN_LIBRARY_BASE}/search.json", params=params)
    data = resp.json()

    results = []
    for doc in data.get("docs", []):
        book_id = doc.get("key", "").replace("/works/", "")
        if not book_id:
            continue
        results.append({
            "id": book_id,
            "title": doc.get("title", "Unknown Title"),
            "author": ", ".join(doc.get("author_name") or []) or None,
            "published_year": doc.get("first_publish_year"),
            "cover_url": _cover_url(doc.get("cover_i")),
            "subjects": (doc.get("subject") or [])[:10],
        })

    return {"results": results, "total": data.get("numFound", 0), "page": page}


def get_book_detail(open_library_id: str) -> Optional[dict]:
    """
    Fetch full book detail from Open Library Works API.

    Returns a normalised book dict or None if not found.
    """
    url = f"{OPEN_LIBRARY_BASE}/works/{open_library_id}.json"
    try:
        resp = _get_with_retry(url)
    except requests.HTTPError as exc:
        if exc.response is not None and exc.response.status_code == 404:
            return None
        raise

    data = resp.json()

    # Fetch author names
    authors = []
    for author_ref in data.get("authors") or []:
        author_key = (author_ref.get("author") or {}).get("key")
        if author_key:
            try:
                author_resp = _get_with_retry(f"{OPEN_LIBRARY_BASE}{author_key}.json")
                authors.append(author_resp.json().get("name", ""))
            except Exception:
                pass

    # Description can be a string or {"type": ..., "value": "..."}
    description = data.get("description")
    if isinstance(description, dict):
        description = description.get("value", "")

    # Cover
    covers = data.get("covers") or []
    cover_url = _cover_url(covers[0]) if covers else None

    subjects = data.get("subjects") or []
    if isinstance(subjects, list):
        subjects = subjects[:15]

    # Try to find Gutenberg ID from identifiers
    gutenberg_id = None
    links = data.get("links") or []
    for link in links:
        if "gutenberg" in (link.get("url") or "").lower():
            # Extract numeric ID from URL e.g. https://www.gutenberg.org/ebooks/1400
            parts = link.get("url", "").rstrip("/").split("/")
            if parts and parts[-1].isdigit():
                gutenberg_id = int(parts[-1])
                break

    return {
        "title": data.get("title", "Unknown Title"),
        "author": ", ".join(a for a in authors if a) or None,
        "published_year": data.get("first_publish_date", "")[:4] or None,
        "cover_url": cover_url,
        "description": description,
        "subjects": subjects,
        "gutenberg_id": gutenberg_id,
    }

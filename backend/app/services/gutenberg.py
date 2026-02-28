"""
Project Gutenberg client (ADR-005).

Responsibility:
  fetch_book_content(gutenberg_id) → plain-text string of the book

Content is fetched once and cached in the book_content table (NFR13).
The cache check is handled at the route level; this service just fetches.
"""

import logging
import requests

logger = logging.getLogger(__name__)

GUTENBERG_MIRRORS = [
    "https://www.gutenberg.org/cache/epub/{id}/pg{id}.txt",
    "https://gutenberg.pglaf.org/cache/epub/{id}/pg{id}.txt",
]
TIMEOUT = 30  # Full text can be large


def fetch_book_content(gutenberg_id: int) -> str:
    """
    Download plain text of a Gutenberg book.

    Tries primary mirror first, falls back to secondary.
    Returns the decoded text string.
    Raises RuntimeError if all mirrors fail.
    """
    errors = []
    for url_template in GUTENBERG_MIRRORS:
        url = url_template.format(id=gutenberg_id)
        try:
            resp = requests.get(url, timeout=TIMEOUT)
            resp.raise_for_status()
            # Gutenberg files are UTF-8 or latin-1
            text = resp.content.decode("utf-8", errors="replace")
            logger.info("Fetched Gutenberg book %d from %s (%d chars)", gutenberg_id, url, len(text))
            return text
        except requests.RequestException as exc:
            logger.warning("Gutenberg mirror failed for book %d at %s: %s", gutenberg_id, url, exc)
            errors.append(str(exc))

    raise RuntimeError(
        f"Could not fetch Gutenberg book {gutenberg_id}. Errors: {'; '.join(errors)}"
    )

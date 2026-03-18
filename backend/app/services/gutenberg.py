import requests

GUTENBERG_SEARCH = "https://gutendex.com/books"


def find_full_text(title, author=None):
    try:
        params = {
            "search":    f"{title} {author or ''}".strip(),
            "mime_type": "text/plain",
        }
        resp = requests.get(GUTENBERG_SEARCH, params=params, timeout=5)
        resp.raise_for_status()
        results = resp.json().get("results", [])
        if not results:
            return None
        book    = results[0]
        formats = book.get("formats", {})
        text_url = (
            formats.get("text/plain; charset=utf-8")
            or formats.get("text/plain")
        )
        if not text_url:
            return None
        return {
            "gutenberg_id": str(book["id"]),
            "text_url":     text_url,
            "title":        book.get("title"),
        }
    except Exception:
        return None


def fetch_text(text_url):
    try:
        resp = requests.get(text_url, timeout=10)
        resp.raise_for_status()
        return resp.text
    except Exception:
        return None

import requests
import os

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"


def search_books(query, limit=12):
    try:
        params = {"q": query, "maxResults": limit}
        api_key = os.getenv("GOOGLE_BOOKS_API_KEY")
        if api_key:
            params["key"] = api_key
        resp = requests.get(GOOGLE_BOOKS_URL, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return [_normalize(item) for item in data.get("items", [])]
    except Exception:
        return []


def _normalize(item):
    info   = item.get("volumeInfo", {})
    images = info.get("imageLinks", {})
    return {
        "external_id":  f"gb_{item['id']}",
        "source":       "google_books",
        "title":        info.get("title", "Unknown"),
        "author":       ", ".join(info.get("authors", [])),
        "genres":       info.get("categories", []),
        "description":  info.get("description"),
        "cover_url":    images.get("thumbnail"),
        "preview_link": info.get("previewLink"),
        "buy_link":     info.get("canonicalVolumeLink"),
    }

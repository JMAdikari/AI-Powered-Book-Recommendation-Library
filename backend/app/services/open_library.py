import requests

OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json"
OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"


def search_books(query, page=1, limit=12):
    try:
        params = {
            "q":      query,
            "page":   page,
            "limit":  limit,
            "fields": "key,title,author_name,subject,description,cover_i,isbn",
        }
        resp = requests.get(OPEN_LIBRARY_SEARCH, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return [_normalize(doc) for doc in data.get("docs", [])]
    except Exception:
        return []


def _normalize(doc):
    cover_id = doc.get("cover_i")
    return {
        "external_id": doc.get("key", "").replace("/works/", "ol_"),
        "source":      "open_library",
        "title":       doc.get("title", "Unknown"),
        "author":      ", ".join(doc.get("author_name", [])),
        "genres":      doc.get("subject", [])[:5],
        "description": None,
        "cover_url":   OPEN_LIBRARY_COVERS.format(cover_id=cover_id) if cover_id else None,
    }

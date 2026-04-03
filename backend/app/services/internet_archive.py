import requests

IA_SEARCH   = "https://archive.org/advancedsearch.php"
IA_METADATA = "https://archive.org/metadata"
IA_IMG      = "https://archive.org/services/img"


def search_books(query, limit=12):
    """Search Internet Archive for text items."""
    try:
        params = {
            "q":      f"({query}) AND mediatype:texts AND language:English",
            "fl[]":   ["identifier", "title", "creator", "subject", "description"],
            "rows":   limit * 2,
            "page":   1,
            "output": "json",
            "sort[]": "downloads desc",
        }
        resp = requests.get(IA_SEARCH, params=params, timeout=8)
        resp.raise_for_status()
        docs    = resp.json().get("response", {}).get("docs", [])
        results = []
        for doc in docs:
            norm = _normalize(doc)
            if norm:
                results.append(norm)
                if len(results) >= limit:
                    break
        return results
    except Exception:
        return []


def find_text_url(identifier):
    """Return the direct URL to a plain-text file for a given IA identifier."""
    try:
        resp = requests.get(f"{IA_METADATA}/{identifier}", timeout=6)
        resp.raise_for_status()
        files = resp.json().get("files", [])
        # Prefer clean plain-text files, skip DjVu and metadata files
        for f in files:
            name = f.get("name", "")
            if (name.endswith(".txt") and
                    "_djvu"    not in name and
                    "_meta"    not in name and
                    "zip_meta" not in name):
                return f"https://archive.org/download/{identifier}/{name}"
        return None
    except Exception:
        return None


def fetch_text(text_url):
    """Fetch raw text from an IA download URL."""
    try:
        resp = requests.get(text_url, timeout=15)
        resp.raise_for_status()
        return resp.text
    except Exception:
        return None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _normalize(doc):
    identifier = doc.get("identifier", "")
    if not identifier:
        return None

    creators = doc.get("creator", [])
    if isinstance(creators, str):
        creators = [creators]
    author = creators[0] if creators else ""

    subjects = doc.get("subject", [])
    if isinstance(subjects, str):
        subjects = [subjects]

    desc = doc.get("description", "")
    if isinstance(desc, list):
        desc = " ".join(desc)

    return {
        "external_id":  f"ia_{identifier}",
        "source":       "internet_archive",
        "title":        doc.get("title", "Unknown"),
        "author":       author,
        "genres":       [s for s in subjects[:5] if isinstance(s, str)],
        "description":  desc[:500] if desc else None,
        "cover_url":    f"{IA_IMG}/{identifier}",
        "_ia_id":       identifier,   # internal — used to look up text URL
    }

import requests

# Gutenberg books are mirrored on Internet Archive under collection:gutenberg
IA_SEARCH   = "https://archive.org/advancedsearch.php"
IA_DOWNLOAD = "https://archive.org/download"
IA_META     = "https://archive.org/metadata"


def search_books(query, page=1, limit=12):
    """Search Project Gutenberg books via Internet Archive (gutendex is unreachable)."""
    try:
        if query:
            q = f'collection:gutenberg AND (title:({query}) OR creator:({query}))'
        else:
            # No query → popular public-domain fiction, sorted by downloads
            q = 'collection:gutenberg AND subject:fiction'

        params = {
            "q":      q,
            "fl[]":   ["identifier", "title", "creator", "subject", "description"],
            "sort[]": "downloads desc",
            "rows":   limit,
            "page":   page,
            "output": "json",
        }
        resp = requests.get(IA_SEARCH, params=params, timeout=10)
        resp.raise_for_status()
        docs = resp.json().get("response", {}).get("docs", [])
        return [n for n in (_normalize(d) for d in docs) if n]
    except Exception:
        return []


def find_full_text(title, author=None):
    """Find a Gutenberg book on IA by title/author. Returns metadata dict or None."""
    try:
        q = f'collection:gutenberg AND title:({title})'
        if author:
            clean = author.split(",")[0].strip()
            q += f' AND creator:({clean})'

        params = {"q": q, "fl[]": ["identifier", "title"], "rows": 3, "output": "json"}
        resp = requests.get(IA_SEARCH, params=params, timeout=8)
        resp.raise_for_status()
        docs = resp.json().get("response", {}).get("docs", [])

        for doc in docs:
            identifier = doc.get("identifier", "")
            if identifier:
                return {
                    "gutenberg_id": identifier,
                    "text_url":     None,   # resolved lazily on first read
                    "title":        doc.get("title", ""),
                }
        return None
    except Exception:
        return None


def get_text_url(identifier):
    """Return a direct URL to the plain-text file for an IA/Gutenberg identifier."""
    try:
        resp = requests.get(f"{IA_META}/{identifier}/files", timeout=6)
        resp.raise_for_status()
        files = resp.json().get("result", [])
        # First pass: clean .txt (not djvu, not zip metadata)
        for f in files:
            name = f.get("name", "")
            if (name.endswith(".txt")
                    and "_djvu"    not in name
                    and "_meta"    not in name
                    and "zip_meta" not in name):
                return f"{IA_DOWNLOAD}/{identifier}/{name}"
        return None
    except Exception:
        return None


def fetch_text(text_url):
    """Fetch raw text from a URL (IA download or any direct URL)."""
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

    creator = doc.get("creator", "")
    if isinstance(creator, list):
        creator = creator[0] if creator else ""

    # Convert "Last, First, birth-death" → "First Last"
    if creator and "," in creator:
        parts      = [p.strip() for p in creator.split(",")]
        name_parts = [p for p in parts if not p.replace("-", "").replace(" ", "").isdigit()]
        if len(name_parts) >= 2:
            creator = f"{name_parts[1]} {name_parts[0]}"
        elif name_parts:
            creator = name_parts[0]

    subjects = doc.get("subject", [])
    if isinstance(subjects, str):
        subjects = [subjects]

    desc = doc.get("description", "")
    if isinstance(desc, list):
        desc = " ".join(str(d) for d in desc if d)

    return {
        "external_id":   f"gut_{identifier}",
        "source":        "gutenberg",
        "title":         doc.get("title", "Unknown"),
        "author":        creator,
        "genres":        [s for s in (subjects or [])[:5] if isinstance(s, str)],
        "description":   str(desc)[:400] if desc else None,
        "cover_url":     f"https://archive.org/services/img/{identifier}",
        "_text_url":     None,          # fetched lazily — keeps search fast
        "_gutenberg_id": identifier,
    }

# Phase 5 — AI Recommendation Engine

> **Status:** Implementation in progress  
> **Core Technology:** TF-IDF Vectorization + Cosine Similarity + Behavioral Signal Weighting  
> **Files:** `backend/app/services/recommender.py` · `backend/app/routes/recommendations.py` · `frontend/src/pages/Dashboard.jsx`

---

## What This Phase Builds

The AI recommendation engine is the **core feature** of BookAI. It answers the question:
> *"Given what this user has read, saved, and liked — what should they read next?"*

The system combines two signals:
1. **Content similarity** — books that are textually similar to ones the user engaged with (TF-IDF)
2. **Behavioral signals** — how strongly the user engaged (saved, favorited, completed, reading)

---

## How the Algorithm Works

### Step 1 — Build the Book Corpus

Every book in the local database is converted into a **text document**:

```
corpus[i] = "{title} {description} {genre1} {genre2} ..."
```

This merges all descriptive metadata into one string per book.

### Step 2 — TF-IDF Vectorization

**TF-IDF** (Term Frequency–Inverse Document Frequency) converts each text document into a numeric vector:

- **TF** (Term Frequency): How often a word appears in *this* book's corpus string
- **IDF** (Inverse Document Frequency): How rare that word is across *all* books

Words like "the", "and", "is" appear in every book → low IDF score → nearly ignored  
Words like "detective", "Victorian", "mystery" appear in few books → high IDF score → high weight

**Result:** Each book becomes a 5,000-dimensional vector where each dimension = weight of one word/phrase.

```python
vectorizer  = TfidfVectorizer(stop_words='english', max_features=5000, ngram_range=(1,2))
tfidf_matrix = vectorizer.fit_transform(corpus)
# Shape: (num_books × 5000)
```

### Step 3 — Cosine Similarity

To find how similar two books are, compute the **cosine similarity** between their vectors:

```
similarity = cos(θ) = (A · B) / (|A| × |B|)
```

- Result is between 0 (completely different) and 1 (identical)
- A book about "Victorian detective mysteries" will score high similarity to other detective fiction

```python
# For one book against all others:
sim_scores = cosine_similarity(tfidf_matrix[book_idx], tfidf_matrix).flatten()
```

### Step 4 — Build the User Interest Vector

Instead of comparing one book to all books, we build a **weighted average** of all books the user has interacted with:

```python
user_vector = sum(tfidf_matrix[book_idx] × behavior_weight for each user book)
```

**Behavior weights:**

| Action | Weight | Reasoning |
|--------|--------|-----------|
| Completed | 1.0 | Strongest signal — user read the whole book |
| Favorited | 0.9 | Explicit "I loved this" signal |
| Reading | 0.6 | Active engagement |
| Saved | 0.3 | Weaker signal — intent, not action |

This means a book the user both completed AND favorited contributes `1.0 + 0.9 = 1.9` weight — much more than one they merely saved.

### Step 5 — Score All Books

Score every book in the catalog against the user interest vector:

```python
content_scores = cosine_similarity(user_vector, tfidf_matrix).flatten()
```

Then apply **behavioral bonuses** on top:

```python
final_score = (
    0.7 × content_score          # TF-IDF similarity to user taste
  + 0.15 × is_favorite_bonus     # user already favorited similar books
  + 0.10 × author_match_bonus    # same author as a book user liked
  + 0.05 × genre_preference_bonus # matches user's stated genre preferences
)
```

### Step 6 — Filter & Rank

- **Remove** books the user already saved/read (they've seen them)
- **Sort** by final_score descending
- **Return** top 10 with a human-readable reason string

---

## Cold-Start Problem

New users have no reading history → no behavioral signals → no personalized recommendations.

**Solution:** Use the user's stated genre/author preferences from onboarding:

1. Search the book catalog for books matching their preferred genres
2. Use those genre-matched books as the "seed" for TF-IDF similarity
3. Label recommendations: *"Based on your interest in Mystery"*

Once the user saves/reads books, the behavioral engine takes over automatically.

---

## Matrix Caching Strategy

Computing TF-IDF for thousands of books is slow (~1-2 seconds). We cache it:

```
App startup → load ml_cache/tfidf_matrix.pkl (if exists)
            → else build from DB and save to .pkl

Every request → matrix already in memory (_tfidf_matrix global)
             → only cosine_similarity() computed per request (<100ms)

Rebuild trigger → when catalog grows by >20% since last build
               → on POST /api/recommendations/refresh (manual)
```

**The matrix is never recomputed on every request** — it's a one-time cost cached in memory and on disk.

---

## API Endpoints

### `GET /api/recommendations`
Returns personalized recommendations for the authenticated user.

**Response:**
```json
{
  "recommendations": [
    {
      "book": { "id": 1, "title": "...", "author": "...", "cover_url": "...", "content_type": "full" },
      "score": 0.847,
      "reason": "Based on your interest in Mystery",
      "reason_type": "genre_preference"
    }
  ],
  "source": "behavioral",   // or "cold_start"
  "total": 10
}
```

**Reason types:**
| Type | Label |
|------|-------|
| `behavioral` | "Because you read {book}" |
| `genre_preference` | "Based on your interest in {genre}" |
| `author_match` | "More by {author}" |
| `cold_start` | "Popular in {genre}" |

### `POST /api/recommendations/refresh`
Forces a matrix rebuild and re-scores. Returns fresh recommendations.

---

## Frontend — Dashboard Page

The Dashboard (`/dashboard`) is the home screen for logged-in users:

```
┌─────────────────────────────────────────────┐
│  Hello, {username}                           │
│  Here are your AI-powered recommendations    │
│                                    [Refresh] │
├─────────────────────────────────────────────┤
│  RecommendationCard × 10                    │
│  ┌────────────────────────────────────────┐ │
│  │ [Cover] Title          [Free/Buy badge]│ │
│  │         Author                         │ │
│  │         ✨ "Because you read Dracula"  │ │
│  └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  No preferences set → "Set Preferences" CTA │
└─────────────────────────────────────────────┘
```

---

## Data Flow

```
GET /api/recommendations
  ↓
recommendations.py route
  ↓
recommender.py: get_recommendations(user_id)
  ↓
  ├─ Load tfidf_matrix (from memory or .pkl)
  ├─ Query UserBook + UserPreference for this user
  ├─ Build user interest vector (weighted sum)
  ├─ cosine_similarity(user_vector, tfidf_matrix)
  ├─ Apply behavioral bonuses
  ├─ Filter already-seen books
  └─ Generate reason strings
  ↓
Return top-10 [{book, score, reason, reason_type}]
  ↓
Dashboard renders RecommendationCard × 10
```

---

## Why TF-IDF + Cosine Similarity?

| Approach | Pros | Cons |
|----------|------|------|
| **TF-IDF + Cosine** (chosen) | No training data needed, fast, interpretable, works on any text | Doesn't capture semantic meaning |
| Collaborative filtering | Learns from many users | Needs large user base, cold-start problem worse |
| Neural embeddings (BERT) | Best semantic understanding | Slow, heavy, overkill for MVP |
| Simple genre matching | Dead simple | No nuance, ignores description |

TF-IDF is the **right choice for MVP** — it works immediately with zero training data, explains its reasoning, and runs in under 100ms per request once the matrix is cached.

---

## Implementation Steps Checklist

- [x] **Step 13** — `recommender.py`: TF-IDF corpus builder, matrix cache, `get_recommendations()`
- [x] **Step 14** — Cold-start path: genre/author seed → TF-IDF similarity
- [x] **Step 15** — Behavioral signals: weights for saved/reading/completed/favorited
- [x] **Step 16** — `recommendations.py` routes: GET + POST /refresh
- [x] **Step 16** — `Dashboard.jsx`: rec cards, reason labels, refresh button, empty states
- [x] **Step 16** — `RecommendationCard.jsx`: cover, reason badge, content-type badge

---

## Files Modified / Created

| File | Role |
|------|------|
| `backend/app/services/recommender.py` | Core TF-IDF engine, behavioral scoring, cold-start logic |
| `backend/app/routes/recommendations.py` | GET /api/recommendations · POST /api/recommendations/refresh |
| `backend/app/routes/books.py` | Existing — books cached here feed the corpus |
| `frontend/src/pages/Dashboard.jsx` | Main recommendation UI, refresh button |
| `frontend/src/components/recommendations/RecommendationCard.jsx` | Card with reason + content badge |
| `frontend/src/services/recommendationService.js` | Already exists — get() + refresh() |
| `ml_cache/tfidf_matrix.pkl` | Auto-generated — persisted TF-IDF matrix |

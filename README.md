# BookAI — AI-Powered Book Recommendation Library

A full-stack web application that combines a personal reading library with an AI recommendation engine. Users can search millions of books, read classic literature for free in-browser, track their reading progress, and receive personalised recommendations that improve the more they read.

---

## Table of Contents

- [Features](#features)
- [AI Recommendation Engine](#ai-recommendation-engine)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)

---

## Features

### For Readers
- **Browse & Search** — Search across millions of books via Google Books + Open Library APIs
- **Free In-Browser Reading** — Full-text classics from Project Gutenberg and Internet Archive, readable without leaving the app
- **Personal Library** — Save books, track status (Saved / Reading / Completed), and mark favourites
- **AI Recommendations** — Personalised book picks that learn from your reading behaviour
- **Reading Dashboard** — Weekly stats, reading streak tracker, and 7-day activity calendar
- **User Profile** — Edit account details, change password, manage genre preferences

### Content Availability
| Badge | Meaning |
|-------|---------|
| **Free** | Full text available — readable in-app right now |
| **Buy** | Purchase links provided (Amazon, Google Books) |
| **Unavailable** | Catalogued but no text or buy link found |

---

## AI Recommendation Engine

The recommendation system is built entirely from scratch using classical machine learning — no third-party AI API is called. It runs fully on the backend and gets smarter as users interact with the library.

### Algorithm: TF-IDF + Cosine Similarity

#### Step 1 — Building the Corpus
Every book in the database is converted into a text document:

```
"{title} {title} {author} {description} {genres} {genres}"
```

Title and genres are repeated to give them higher term-frequency weight, since they are the strongest signals for book similarity.

#### Step 2 — Vectorisation with TF-IDF
The corpus is fed into a `TfidfVectorizer` (scikit-learn):

```python
TfidfVectorizer(
    stop_words="english",   # removes common words like "the", "a"
    max_features=5000,      # top 5000 most informative terms
    ngram_range=(1, 2),     # includes single words AND two-word phrases
    min_df=1,
)
```

This produces a sparse matrix where each row is a book and each column is a weighted term. Words that appear in many books (low discriminative power) get a lower weight; rare but meaningful words get higher weight.

The matrix is cached to disk (`ml_cache/tfidf_matrix.pkl`) and reloaded on server start — so cold requests are fast. The cache auto-rebuilds when the catalog grows by more than 20%.

#### Step 3 — Building a User Interest Vector

Instead of comparing a query book to all others, BookAI computes a **weighted user interest vector** from everything the user has read:

```python
BEHAVIOR_WEIGHTS = {
    "completed": 1.0,   # finished = strongest signal
    "reading":   0.6,   # in-progress = moderate signal
    "saved":     0.3,   # saved = weak signal (intent, not action)
}
FAVORITE_BONUS = 0.9    # added on top when user marked book as favourite
```

Each book the user interacted with contributes its TF-IDF vector, scaled by its weight. All weighted vectors are summed and L2-normalised to produce a single vector representing the user's taste profile.

```
user_vector = Σ (book_tfidf_vector × interaction_weight)
user_vector = user_vector / ‖user_vector‖
```

#### Step 4 — Scoring All Unseen Books

Cosine similarity is computed between the user interest vector and every unseen book in the matrix:

```
similarity(u, b) = (u · b) / (‖u‖ × ‖b‖)
```

Because both vectors are L2-normalised, this reduces to a dot product — fast even on large catalogs.

#### Step 5 — Bonus Scoring & Reason Generation

Raw similarity scores are adjusted with bonuses:

| Condition | Bonus | Reason label shown to user |
|-----------|-------|---------------------------|
| Book is by the same author as user's top-weighted book | +0.10 | "More by {Author}" |
| Book's genre matches a stated preference | +0.05 | "Based on your interest in {Genre}" |

The final reason string ("Because you read {Book}", "Based on your interest in Fantasy", etc.) is generated alongside every recommendation so users understand *why* they're seeing each pick.

#### Cold Start (New Users)

New users with no reading history are handled gracefully:

1. If the user set genre preferences during onboarding → find books matching that genre → build a seed vector → run cosine similarity against the full catalog
2. If no preferences set → return most popular books from the catalog

Cold-start recommendations automatically upgrade to behavioural recommendations the moment the user saves, starts reading, or completes their first book.

#### Auto-Refresh on Completion

When a user marks a book as **Completed**, the backend immediately triggers a recommendation refresh so the next visit shows updated picks that reflect the newly completed book.

---

## Tech Stack

### Backend
| Technology | Version | Role |
|-----------|---------|------|
| Python | 3.11+ | Language |
| Flask | 3.1 | Web framework (app factory + blueprints) |
| Flask-SQLAlchemy | 3.1 | ORM |
| Flask-JWT-Extended | 4.7 | JWT authentication |
| Flask-Migrate | 4.1 | Database migrations (Alembic) |
| Flask-Bcrypt | 1.0 | Password hashing |
| scikit-learn | 1.8 | TF-IDF vectorisation + cosine similarity |
| NumPy | 2.4 | Vector math |
| SQLite | — | Database (dev) |

### Frontend
| Technology | Version | Role |
|-----------|---------|------|
| React | 18.3 | UI framework |
| Vite | 5.3 | Build tool |
| React Router | 6.24 | Client-side routing |
| Tailwind CSS | 3.4 | Styling |
| Axios | 1.7 | HTTP client |

### External APIs
| API | Purpose |
|-----|---------|
| Google Books API | Book search, metadata, cover images, buy links |
| Open Library API | Additional metadata |
| Project Gutenberg | Free full-text book content |
| Internet Archive | Free full-text book content |

---

## Project Structure

```
AI-Powered-Book-Recommendation-Library/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── user.py              # User account
│   │   │   ├── user_book.py         # Library entries (saved/reading/completed)
│   │   │   ├── user_preference.py   # Genre & author preferences
│   │   │   ├── book.py              # Book catalog
│   │   │   ├── book_content.py      # Cached full-text content
│   │   │   └── reading_progress.py  # Per-book page progress
│   │   ├── routes/
│   │   │   ├── auth.py              # Register, login, profile, password
│   │   │   ├── books.py             # Search, detail, in-browser reader
│   │   │   ├── library.py           # Save, status, favourite, remove
│   │   │   ├── recommendations.py   # AI recommendation endpoints
│   │   │   └── progress.py          # Weekly stats, streak, activity
│   │   └── services/
│   │       ├── recommender.py       # TF-IDF engine (core AI)
│   │       ├── google_books.py      # Google Books API client
│   │       ├── gutenberg.py         # Project Gutenberg fetcher
│   │       └── internet_archive.py  # Internet Archive fetcher
│   ├── ml_cache/
│   │   └── tfidf_matrix.pkl         # Persisted TF-IDF matrix
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx             # Landing page
        │   ├── Search.jsx           # Book search + filters
        │   ├── BookDetail.jsx       # Book info + save/read actions
        │   ├── Reader.jsx           # In-browser full-text reader
        │   ├── Dashboard.jsx        # AI recs + reading stats
        │   ├── Library.jsx          # Personal library
        │   └── Profile.jsx          # Account + preferences
        ├── components/
        │   ├── books/BookCard.jsx
        │   └── recommendations/RecommendationCard.jsx
        └── services/
            ├── recommendationService.js
            ├── libraryService.js
            └── progressService.js
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Google Books API key](https://developers.google.com/books)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GOOGLE_BOOKS_API_KEY and a JWT_SECRET_KEY

# Run database migrations
flask db upgrade

# Start the development server
python run.py
```

The API will be available at `http://localhost:5000`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Create .env with:
# VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in, receive JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update username / email |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/auth/preferences` | Get reading preferences |
| PUT | `/api/auth/preferences` | Update preferences |

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books/search?q=&page=` | Search books |
| GET | `/api/books/<external_id>` | Book detail |
| GET | `/api/books/<external_id>/content?page=` | Read full text (paginated) |

### Library
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/library` | Get user's library |
| POST | `/api/library` | Save a book |
| PUT | `/api/library/<id>/status` | Update reading status |
| PUT | `/api/library/<id>/favorite` | Toggle favourite |
| DELETE | `/api/library/<id>` | Remove from library |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get AI recommendations |
| POST | `/api/recommendations/refresh` | Force recommendation refresh |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress/weekly` | Weekly stats, streak, activity |

---

## How Recommendations Improve Over Time

```
New user → Cold start (genre preferences or popular picks)
     ↓
Saves first book → Weak behavioral signal (weight 0.3)
     ↓
Starts reading → Stronger signal (weight 0.6)
     ↓
Marks as Completed → Strongest signal (weight 1.0) + auto-refresh
     ↓
Marks as Favourite → Extra +0.9 bonus on top of status weight
     ↓
Richer user vector → More precise cosine similarity scores
     ↓
Better, more personalised recommendations
```

The system requires no manual tuning or retraining — it adapts automatically with every user action.

---



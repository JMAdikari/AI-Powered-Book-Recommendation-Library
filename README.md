# AI-Powered Book Recommendation Library — Backend

Flask REST API with TF-IDF recommendation engine.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Flask 3 |
| ORM | SQLAlchemy + Flask-Migrate |
| Auth | Flask-JWT-Extended (stateless JWT) |
| Password hashing | Flask-Bcrypt (12 rounds) |
| ML / AI | Scikit-learn (TF-IDF + Cosine Similarity) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| External APIs | Open Library · Project Gutenberg · Google Books |

## Quick Start

```bash
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
copy .env.example .env         # Windows
# cp .env.example .env        # macOS/Linux
# Edit .env and fill in your SECRET_KEY, JWT_SECRET_KEY, etc.

# 4. Initialise the database
flask db init
flask db migrate -m "initial schema"
flask db upgrade

# 5. Run the development server
python run.py
# API available at http://localhost:5000
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # App factory (create_app)
│   ├── config.py            # Dev / Prod config classes
│   ├── extensions.py        # db, jwt, cors, bcrypt, migrate
│   ├── models/
│   │   ├── user.py          # User, UserPreference
│   │   ├── book.py          # Book, BookContent
│   │   └── library.py       # UserBook, ReadingProgress
│   ├── routes/
│   │   ├── auth.py          # POST /api/auth/register|login
│   │   ├── books.py         # GET /api/books/search|:id|:id/content
│   │   ├── library.py       # GET/POST/PATCH/DELETE /api/library
│   │   ├── recommendations.py  # GET /api/recommendations
│   │   └── profile.py       # GET/PATCH /api/profile
│   └── services/
│       ├── recommender.py   # TF-IDF engine
│       ├── open_library.py  # Open Library API client
│       ├── gutenberg.py     # Project Gutenberg client
│       └── google_books.py  # Google Books fallback client
├── migrations/              # Flask-Migrate (Alembic)
├── tests/
│   ├── conftest.py
│   └── test_auth.py
├── .env.example
├── .gitignore
├── requirements.txt
└── run.py
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register + return JWT |
| POST | `/api/auth/login` | — | Login + return JWT |
| GET | `/api/books/search?q=` | — | Search books |
| GET | `/api/books/:id` | — | Book detail |
| GET | `/api/books/:id/content` | ✓ | Full text (Gutenberg) |
| GET | `/api/library` | ✓ | User's library |
| POST | `/api/library` | ✓ | Save book |
| PATCH | `/api/library/:id` | ✓ | Update status/favorite |
| DELETE | `/api/library/:id` | ✓ | Remove book |
| GET | `/api/recommendations` | ✓ | Personalised recs |
| GET | `/api/profile` | ✓ | User profile + stats |
| PATCH | `/api/profile/preferences` | ✓ | Update preferences |
| GET | `/api/health` | — | Health check |

## Running Tests

```bash
pytest
```

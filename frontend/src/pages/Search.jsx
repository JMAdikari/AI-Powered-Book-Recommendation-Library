import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { bookService } from "../services/bookService"
import { libraryService } from "../services/libraryService"
import { useAuth } from "../context/AuthContext"
import BookCard from "../components/books/BookCard"
import { SkeletonCard } from "../components/ui/Skeleton"

const FILTERS = [
  { label: "All",         value: "all",  dot: null },
  { label: "Read Free",   value: "full", dot: "bg-green-500" },
  { label: "Buy",         value: "buy",  dot: "bg-amber-500" },
  { label: "Unavailable", value: "none", dot: "bg-gray-500" },
]

export default function Search({ showToast }) {
  const { isAuthenticated }  = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query,    setQuery]    = useState(searchParams.get("q") || "")
  const [allBooks, setAllBooks] = useState([])
  const [filter,   setFilter]   = useState("all")
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const timerRef = useRef(null)

  const books = allBooks.filter(b => {
    if (filter === "all")  return true
    if (filter === "full") return b.content_type === "full"
    if (filter === "buy")  return b.content_type === "buy" || b.content_type === "preview"
    if (filter === "none") return !b.content_type || b.content_type === "none"
    return true
  })

  const doSearch = useCallback(async (q, free = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await bookService.search(q, 1, free)
      setAllBooks(res.data.books || [])
    } catch {
      setError("Search failed. Please try again.")
      setAllBooks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get("q") || ""
    doSearch(q)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (filter === "full" && !query.trim()) {
      doSearch("", true)
    } else if (query.trim()) {
      doSearch(query, filter === "full")
    }
  }, [filter]) // eslint-disable-line

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSearchParams(val ? { q: val } : {})
      doSearch(val, filter === "full")
    }, 300)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    clearTimeout(timerRef.current)
    setSearchParams(query ? { q: query } : {})
    doSearch(query, filter === "full")
  }

  const handleSave = async (book) => {
    if (!isAuthenticated) { showToast?.("Sign in to save books", "info"); return }
    try {
      await libraryService.addBook({ external_id: book.external_id })
      showToast?.("Saved to library", "success")
    } catch {
      showToast?.("Failed to save", "error")
    }
  }

  const handleFavorite = async (book) => {
    if (!isAuthenticated) { showToast?.("Sign in to favourite books", "info"); return }
    try {
      await libraryService.addBook({ external_id: book.external_id })
      showToast?.("Added to favourites", "success")
    } catch {
      showToast?.("Failed to favourite", "error")
    }
  }

  const isPopular  = !query.trim()
  const countLabel = isPopular ? "Popular Free Books" : `${books.length} results for "${query}"`

  return (
    <div className="pt-20 min-h-screen bg-[#0A0A10] px-4">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="py-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1A1A2E] border border-[#2A2A4A]
                           text-gray-400 text-xs font-semibold rounded-full mb-5">
            <span>⚡</span> AI-powered · TF-IDF + Cosine Similarity
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Discover Your Next Great Read
          </h1>
          <p className="text-gray-500 text-sm mb-7">Millions of books. Personalized just for you.</p>

          {/* Search input */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">&#x2315;</span>
              <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Search by title, author or genre..."
                className="w-full pl-12 pr-4 py-3.5 border border-[#1E1E30] rounded-2xl text-sm
                           bg-[#13131F] text-gray-200 placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-brand transition"
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-600 font-medium uppercase tracking-wide mr-1">Filter:</span>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition
                ${filter === f.value
                  ? f.value === "full" ? "bg-green-600 text-white border-green-600"
                  : f.value === "buy"  ? "bg-amber-600 text-white border-amber-600"
                  : f.value === "none" ? "bg-gray-600 text-white border-gray-600"
                  :                      "bg-brand text-white border-brand"
                  : "bg-transparent text-gray-500 border-[#2A2A3A] hover:border-brand hover:text-brand"}`}
            >
              {f.dot && <span className={`w-2 h-2 rounded-full ${filter === f.value ? "bg-white" : f.dot}`} />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-8 text-xs text-gray-600 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />
            Read Now — full text available, read in-app
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-600 inline-block" />
            Find to Buy — links to purchase page
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-600 inline-block" />
            Unavailable — no text or buy link found
          </span>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center bg-red-950 border border-red-900
                        rounded-xl py-3">{error}</p>
        )}

        {/* Results header */}
        {!loading && books.length > 0 && (
          <p className="text-sm font-semibold text-white mb-4">
            {countLabel}
            <span className="text-gray-600 font-normal ml-2">({books.length})</span>
          </p>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty filtered state */}
        {!loading && !error && books.length === 0 && allBooks.length > 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="w-10 h-10 bg-[#1E1E2A] rounded-xl mx-auto mb-3" />
            <p className="font-medium text-gray-300">
              No {filter === "full" ? "free-to-read" : filter === "buy" ? "buyable" : "unavailable"} books in these results
            </p>
            <button onClick={() => setFilter("all")} className="mt-3 text-brand text-sm hover:underline">
              Show all results
            </button>
          </div>
        )}

        {/* No results */}
        {!loading && !error && allBooks.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="w-10 h-10 bg-[#1E1E2A] rounded-xl mx-auto mb-4" />
            <p className="font-medium text-lg text-gray-300">No books found for "{query}"</p>
            <p className="text-sm mt-1">Try a different title or author name</p>
          </div>
        )}

        {/* Grid */}
        {!loading && books.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
            {books.map(book => (
              <BookCard
                key={book.external_id}
                book={book}
                onSave={handleSave}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

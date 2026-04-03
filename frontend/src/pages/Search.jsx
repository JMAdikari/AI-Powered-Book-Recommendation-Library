import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { bookService } from "../services/bookService"
import { libraryService } from "../services/libraryService"
import { useAuth } from "../context/AuthContext"
import BookCard from "../components/books/BookCard"
import { SkeletonCard } from "../components/ui/Skeleton"

const FILTERS = [
  { label: "All",         value: "all" },
  { label: "Read Free",   value: "full" },
  { label: "Buy",         value: "buy" },
  { label: "Unavailable", value: "none" },
]

export default function Search({ showToast }) {
  const { isAuthenticated }  = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query,    setQuery]    = useState(searchParams.get("q") || "")
  const [allBooks, setAllBooks] = useState([])    // full result set
  const [filter,   setFilter]   = useState("all") // client-side filter
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const timerRef = useRef(null)

  // Filtered view derived from allBooks
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

  // On mount: load from URL param or popular books
  useEffect(() => {
    const q = searchParams.get("q") || ""
    doSearch(q)
  }, []) // eslint-disable-line

  // Re-run when Free to Read filter selected with no query
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
  const countLabel = isPopular ? "Popular free books" : `${books.length} results for "${query}"`

  return (
    <div className="pt-20 min-h-screen bg-background px-4">
      <div className="max-w-5xl mx-auto">

        {/* Search bar */}
        <div className="py-8">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Search by title, author or genre…"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-base
                           focus:outline-none focus:ring-2 focus:ring-brand shadow-sm bg-white"
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">Filter:</span>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition
                ${filter === f.value
                  ? f.value === "full" ? "bg-green-500 text-white border-green-500"
                  : f.value === "buy"  ? "bg-amber-500 text-white border-amber-500"
                  : f.value === "none" ? "bg-gray-400 text-white border-gray-400"
                  :                      "bg-brand text-white border-brand"
                  : "bg-white text-gray-500 border-gray-300 hover:border-brand hover:text-brand"}`}
            >
              {f.value === "full" && <span className="mr-1">●</span>}
              {f.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-6 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            Read Now — full text available, read in-app
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
            Find to Buy — links to purchase page
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-300 inline-block" />
            Unavailable — no text or buy link found
          </span>
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty filtered state */}
        {!loading && !error && books.length === 0 && allBooks.length > 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔎</div>
            <p className="font-medium">No {filter === "full" ? "free-to-read" : filter === "buy" ? "buyable" : "unavailable"} books in these results</p>
            <button onClick={() => setFilter("all")} className="mt-3 text-brand text-sm hover:underline">
              Show all results
            </button>
          </div>
        )}

        {/* No results at all */}
        {!loading && !error && allBooks.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-medium text-lg">No books found for "{query}"</p>
            <p className="text-sm mt-1">Try a different title or author name</p>
          </div>
        )}

        {/* Results */}
        {!loading && books.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{countLabel}</p>
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
          </>
        )}

      </div>
    </div>
  )
}

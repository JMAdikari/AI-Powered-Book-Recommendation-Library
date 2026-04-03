import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { bookService } from "../services/bookService"
import BookCard from "../components/books/BookCard"
import { SkeletonCard } from "../components/ui/Skeleton"

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query,    setQuery]    = useState(searchParams.get("q") || "")
  const [books,    setBooks]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setBooks([])
      setSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await bookService.search(q)
      setBooks(res.data.books || [])
    } catch {
      setError("Search failed. Please try again.")
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Run search from URL param on mount
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) doSearch(q)
  }, []) // eslint-disable-line

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSearchParams(val ? { q: val } : {})
      doSearch(val)
    }, 300)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    clearTimeout(timerRef.current)
    setSearchParams(query ? { q: query } : {})
    doSearch(query)
  }

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

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && books.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-medium text-lg">No books found for "{query}"</p>
            <p className="text-sm mt-1">Try a different title or author name</p>
          </div>
        )}

        {/* Prompt before first search */}
        {!loading && !searched && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📚</div>
            <p className="font-medium">Start typing to discover books</p>
          </div>
        )}

        {/* Results grid */}
        {!loading && books.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{books.length} results for "{query}"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
              {books.map(book => (
                <BookCard key={book.external_id} book={book} />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

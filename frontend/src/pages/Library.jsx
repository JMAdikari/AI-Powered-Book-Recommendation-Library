import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { libraryService } from "../services/libraryService"
import { recommendationService } from "../services/recommendationService"
import EmptyState from "../components/ui/EmptyState"
import { SkeletonCard } from "../components/ui/Skeleton"

const TABS = [
  { label: "All",       value: null },
  { label: "Reading",   value: "reading" },
  { label: "Completed", value: "completed" },
  { label: "Favorites", value: "favorites" },
]

export default function Library({ showToast }) {
  const navigate  = useNavigate()
  const [books,   setBooks]   = useState([])
  const [tab,     setTab]     = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLibrary = async (activeTab) => {
    setLoading(true)
    try {
      const params = {}
      if (activeTab === "favorites")  params.favorites = "true"
      else if (activeTab)             params.status    = activeTab
      const res = await libraryService.getAll(params)
      setBooks(res.data.books || [])
    } catch {
      showToast?.("Failed to load library", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLibrary(tab) }, [tab]) // eslint-disable-line

  const handleRemove = async (userBookId) => {
    try {
      await libraryService.removeBook(userBookId)
      setBooks(prev => prev.filter(b => b.id !== userBookId))
      showToast?.("Removed from library", "info")
    } catch {
      showToast?.("Failed to remove", "error")
    }
  }

  const handleToggleFavorite = async (userBookId, current) => {
    try {
      await libraryService.toggleFavorite(userBookId)
      setBooks(prev => prev.map(b =>
        b.id === userBookId ? { ...b, is_favorite: !current } : b
      ))
    } catch {
      showToast?.("Failed to update favorite", "error")
    }
  }

  const handleStatusChange = async (userBookId, newStatus) => {
    try {
      await libraryService.updateStatus(userBookId, newStatus)
      setBooks(prev => prev.map(b =>
        b.id === userBookId ? { ...b, status: newStatus } : b
      ))
      showToast?.(`Marked as ${newStatus}`, "success")

      // Step 24 — auto-refresh recommendations when a book is completed
      if (newStatus === "completed") {
        showToast?.("Updating your recommendations…", "info")
        try {
          await recommendationService.refresh()
          showToast?.("Recommendations updated!", "success")
        } catch {
          // non-critical — recs will update on next Dashboard visit
        }
      }
    } catch {
      showToast?.("Failed to update status", "error")
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-background px-4">
      <div className="max-w-5xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Library</h1>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={String(t.value)}
              onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                ${tab === t.value
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && books.length === 0 && (
          <EmptyState
            title="Nothing here yet"
            message={
              tab === "favorites"  ? "Favourite books from search to see them here" :
              tab === "reading"    ? "Start reading a book to see it here" :
              tab === "completed"  ? "Mark books as completed to see them here" :
              "Save books from search to build your personal library"
            }
            action={{ label: "Browse Books", onClick: () => navigate("/search") }}
          />
        )}

        {/* Grid */}
        {!loading && books.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
            {books.map(ub => (
              <LibraryCard
                key={ub.id}
                userBook={ub}
                onRemove={handleRemove}
                onToggleFavorite={handleToggleFavorite}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LibraryCard({ userBook, onRemove, onToggleFavorite, onStatusChange }) {
  const navigate = useNavigate()
  const { book, status, is_favorite, id } = userBook

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100
                    hover:shadow-md transition group">
      {/* Cover */}
      <div
        className="relative aspect-[2/3] bg-gray-100 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/books/${book.external_id}`)}
      >
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            📖
          </div>
        )}

        {/* Hover action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5
                        opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(id, is_favorite) }}
            className={`w-7 h-7 bg-white rounded-full shadow flex items-center justify-center
                        text-sm transition
                        ${is_favorite ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
            title={is_favorite ? "Unfavorite" : "Favorite"}
          >
            {is_favorite ? "♥" : "♡"}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(id) }}
            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center
                       text-sm text-gray-400 hover:text-red-500 transition"
            title="Remove from library"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Meta + status */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 truncate">{book.title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{book.author || "Unknown"}</p>
        <select
          value={status}
          onChange={e => onStatusChange(id, e.target.value)}
          onClick={e => e.stopPropagation()}
          className="mt-2 w-full text-xs border border-gray-200 rounded-md px-1.5 py-1
                     focus:outline-none focus:ring-1 focus:ring-brand bg-white cursor-pointer"
        >
          <option value="saved">Saved</option>
          <option value="reading">Reading</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  )
}

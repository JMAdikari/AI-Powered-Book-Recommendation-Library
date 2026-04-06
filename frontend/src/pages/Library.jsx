import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { libraryService } from "../services/libraryService"
import { recommendationService } from "../services/recommendationService"
import EmptyState from "../components/ui/EmptyState"
import { SkeletonCard } from "../components/ui/Skeleton"

const TABS = [
  { label: "All",       value: null,        icon: "📚" },
  { label: "Reading",   value: "reading",   icon: "📖" },
  { label: "Completed", value: "completed", icon: "✅" },
  { label: "Favourites",value: "favorites", icon: "❤️" },
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
      if (newStatus === "completed") {
        showToast?.("Updating your recommendations…", "info")
        try {
          await recommendationService.refresh()
          showToast?.("Recommendations updated!", "success")
        } catch {}
      }
    } catch {
      showToast?.("Failed to update status", "error")
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-[#0A0A10] px-4">
      <div className="max-w-5xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-white mb-1">My Library</h1>
        <p className="text-sm text-gray-500 mb-6">
          {books.length} book{books.length !== 1 ? "s" : ""} in your collection
        </p>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map(t => (
            <button
              key={String(t.value)}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition
                border
                ${tab === t.value
                  ? "bg-brand text-white border-brand"
                  : "bg-[#13131F] text-gray-400 border-[#1E1E30] hover:border-brand/50 hover:text-white"}`}
            >
              <span>{t.icon}</span>
              {t.label}
              {!loading && tab === t.value && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {books.length}
                </span>
              )}
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
  const [menuOpen, setMenuOpen] = useState(false)
  const { book, status, is_favorite, id } = userBook

  return (
    <div className="bg-[#13131F] rounded-xl overflow-hidden border border-[#1E1E30]
                    hover:border-brand/30 transition-all group">
      {/* Cover */}
      <div
        className="relative aspect-[2/3] bg-[#1A1A2E] overflow-hidden cursor-pointer"
        onClick={() => navigate(`/books/${book.external_id}`)}
      >
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700">📖</div>
        )}

        {/* Star rating */}
        {book.rating && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs font-semibold
                           text-white bg-black/60 rounded-full px-2 py-0.5">
            ⭐ {Number(book.rating).toFixed(1)}
          </span>
        )}

        {/* Three-dot menu */}
        <div className="absolute top-2 right-2">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="w-7 h-7 bg-black/60 rounded-full flex items-center justify-center
                       text-white text-xs hover:bg-black/80 transition"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-36 bg-[#1A1A2E] border border-[#2A2A3A]
                            rounded-xl shadow-2xl z-20 overflow-hidden">
              <button
                onClick={e => { e.stopPropagation(); onToggleFavorite(id, is_favorite); setMenuOpen(false) }}
                className="w-full text-left px-3 py-2.5 text-xs text-gray-300 hover:bg-[#2A2A3A] transition"
              >
                {is_favorite ? "♥ Unfavourite" : "♡ Favourite"}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemove(id); setMenuOpen(false) }}
                className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-[#2A2A3A] transition"
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta + status */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-white truncate">{book.title}</p>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">{book.author || "Unknown"}</p>
        <select
          value={status}
          onChange={e => onStatusChange(id, e.target.value)}
          onClick={e => e.stopPropagation()}
          className="mt-2 w-full text-xs border border-[#2A2A3A] rounded-lg px-1.5 py-1.5
                     focus:outline-none focus:ring-1 focus:ring-brand bg-[#1A1A2E]
                     text-gray-300 cursor-pointer"
        >
          <option value="saved">Saved</option>
          <option value="reading">Reading</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const BADGE = {
  full:    { label: "Free",        cls: "bg-green-500 text-white" },
  buy:     { label: "Buy",         cls: "bg-amber-500 text-white" },
  preview: { label: "Buy",         cls: "bg-amber-500 text-white" },
  none:    { label: "Unavailable", cls: "bg-gray-300 text-gray-600" },
}

export default function BookCard({ book, onSave, onFavorite }) {
  const { isAuthenticated } = useAuth()
  const navigate            = useNavigate()
  const badge               = BADGE[book.content_type] || BADGE.none

  // Which prompt is open: null | "save" | "fav"
  const [prompt, setPrompt] = useState(null)
  const promptRef           = useRef(null)

  // Close prompt when clicking outside
  useEffect(() => {
    if (!prompt) return
    const handler = (e) => {
      if (promptRef.current && !promptRef.current.contains(e.target)) {
        setPrompt(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [prompt])

  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) { setPrompt("save"); return }
    onSave?.(book)
  }

  const handleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) { setPrompt("fav"); return }
    onFavorite?.(book)
  }

  return (
    <Link
      to={`/books/${book.external_id}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100
                 hover:shadow-md transition flex flex-col group"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden flex-shrink-0">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            📖
          </div>
        )}

        {/* Status badge — top left */}
        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5
                          rounded-full shadow-sm ${badge.cls}`}>
          {badge.label}
        </span>

        {/* Save / Favourite — always visible */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5" ref={promptRef}>
          <button
            onClick={handleSave}
            className={`w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center
                        text-base transition-colors
                        ${isAuthenticated
                          ? "hover:bg-indigo-600 hover:text-white"
                          : "opacity-70 hover:opacity-100"}`}
            title={isAuthenticated ? "Save to Library" : "Sign up to save books"}
          >
            🔖
          </button>
          <button
            onClick={handleFavorite}
            className={`w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center
                        text-base transition-colors
                        ${isAuthenticated
                          ? "hover:bg-red-500 hover:text-white"
                          : "opacity-70 hover:opacity-100"}`}
            title={isAuthenticated ? "Add to Favourites" : "Sign up to favourite books"}
          >
            ♡
          </button>

          {/* Auth prompt bubble */}
          {prompt && (
            <div
              onClick={e => e.preventDefault()}
              className="absolute right-10 top-0 w-44 bg-gray-900 text-white text-xs
                         rounded-xl shadow-xl p-3 z-50 animate-fade-in"
            >
              <p className="font-medium mb-1 leading-snug">
                {prompt === "save" ? "Save books to your library" : "Favourite books you love"}
              </p>
              <p className="text-gray-400 mb-2 leading-snug">
                Create a free account to get started.
              </p>
              <button
                onClick={e => { e.preventDefault(); navigate("/register") }}
                className="w-full py-1.5 bg-brand text-white rounded-lg font-semibold
                           hover:bg-indigo-500 transition text-xs"
              >
                Create account
              </button>
              <button
                onClick={e => { e.preventDefault(); navigate("/login") }}
                className="w-full py-1 text-gray-400 hover:text-white transition text-xs mt-1"
              >
                Already have one? Log in
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {book.title}
        </p>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {book.author || "Unknown author"}
        </p>
        {(book.genres || []).length > 0 && (
          <span className="mt-2 inline-block px-2 py-0.5 bg-indigo-50 text-brand text-xs rounded-full w-fit truncate">
            {book.genres[0]}
          </span>
        )}
      </div>
    </Link>
  )
}

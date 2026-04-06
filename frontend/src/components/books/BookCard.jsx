import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const BADGE = {
  full:    { label: "Free", cls: "bg-green-600 text-white" },
  buy:     { label: "Buy",  cls: "bg-amber-600 text-white" },
  preview: { label: "Buy",  cls: "bg-amber-600 text-white" },
  none:    { label: "Unavailable", cls: "bg-gray-600 text-gray-200" },
}

const ACTION = {
  full:    { label: "Read Now",    cls: "bg-[#1A2A1A] text-green-400 hover:bg-green-800/40",  icon: "📖" },
  buy:     { label: "Find to Buy", cls: "bg-[#2A2010] text-amber-400 hover:bg-amber-800/30", icon: "🛒" },
  preview: { label: "Find to Buy", cls: "bg-[#2A2010] text-amber-400 hover:bg-amber-800/30", icon: "🛒" },
}

export default function BookCard({ book, onSave, onFavorite }) {
  const { isAuthenticated } = useAuth()
  const navigate            = useNavigate()
  const badge               = BADGE[book.content_type] || BADGE.none
  const action              = ACTION[book.content_type]

  const [prompt, setPrompt] = useState(null)
  const promptRef           = useRef(null)

  useEffect(() => {
    if (!prompt) return
    const handler = (e) => {
      if (promptRef.current && !promptRef.current.contains(e.target)) setPrompt(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [prompt])

  const handleSave = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { setPrompt("save"); return }
    onSave?.(book)
  }

  const handleFavorite = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { setPrompt("fav"); return }
    onFavorite?.(book)
  }

  return (
    <div className="bg-[#13131F] rounded-xl overflow-hidden border border-[#1E1E30]
                    hover:border-brand/40 transition-all flex flex-col group">
      {/* Cover */}
      <Link to={`/books/${book.external_id}`} className="block relative aspect-[2/3] bg-[#1A1A2E] overflow-hidden flex-shrink-0">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">📖</div>
        )}

        {/* Content type badge — top left */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>

        {/* Star rating — bottom left */}
        {book.rating && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs font-semibold
                           text-white bg-black/60 rounded-full px-2 py-0.5">
            ⭐ {Number(book.rating).toFixed(1)}
          </span>
        )}

        {/* Save / Fav buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5" ref={promptRef}>
          <button
            onClick={handleSave}
            className="w-7 h-7 bg-black/50 hover:bg-brand rounded-full flex items-center
                       justify-center text-xs text-white transition-colors"
            title={isAuthenticated ? "Save to Library" : "Sign up to save books"}
          >
            🔖
          </button>
          <button
            onClick={handleFavorite}
            className="w-7 h-7 bg-black/50 hover:bg-red-600 rounded-full flex items-center
                       justify-center text-xs text-white transition-colors"
            title={isAuthenticated ? "Add to Favourites" : "Sign up to favourite books"}
          >
            ♡
          </button>

          {/* Auth prompt bubble */}
          {prompt && (
            <div
              onClick={e => e.preventDefault()}
              className="absolute right-9 top-0 w-44 bg-gray-900 border border-[#2A2A3A] text-white
                         text-xs rounded-xl shadow-2xl p-3 z-50 animate-fade-in"
            >
              <p className="font-semibold mb-1 leading-snug">
                {prompt === "save" ? "Save books to your library" : "Favourite books you love"}
              </p>
              <p className="text-gray-500 mb-2 leading-snug">Create a free account to get started.</p>
              <button
                onClick={e => { e.preventDefault(); navigate("/register") }}
                className="w-full py-1.5 bg-brand text-white rounded-lg font-semibold
                           hover:bg-indigo-500 transition text-xs"
              >
                Create account
              </button>
              <button
                onClick={e => { e.preventDefault(); navigate("/login") }}
                className="w-full py-1 text-gray-500 hover:text-white transition text-xs mt-1"
              >
                Already have one? Log in
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Meta */}
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/books/${book.external_id}`}>
          <p className="text-xs font-semibold text-white truncate leading-tight hover:text-brand transition-colors">
            {book.title}
          </p>
        </Link>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">
          {book.author || "Unknown author"}
        </p>

        {/* Genre + action row */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {(book.genres || []).length > 0 && (
            <span className="px-2 py-0.5 bg-[#1A1A3A] text-brand text-[10px] font-medium rounded-full truncate max-w-[80px]">
              {book.genres[0]}
            </span>
          )}
          {action && (
            <Link
              to={`/books/${book.external_id}`}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                          transition-colors ${action.cls}`}
            >
              <span>{action.icon}</span>
              {action.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

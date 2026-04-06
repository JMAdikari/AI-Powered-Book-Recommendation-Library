import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const BADGE = {
  full:    { label: "Free",        cls: "bg-green-600 text-white" },
  buy:     { label: "Buy",         cls: "bg-amber-600 text-white" },
  preview: { label: "Buy",         cls: "bg-amber-600 text-white" },
  none:    { label: "Unavailable", cls: "bg-gray-600 text-gray-200" },
}

const ACTION = {
  full:    { label: "Read Now",    cls: "bg-green-800 text-green-100 hover:bg-green-700" },
  buy:     { label: "Find to Buy", cls: "bg-amber-800 text-amber-100 hover:bg-amber-700" },
  preview: { label: "Find to Buy", cls: "bg-amber-800 text-amber-100 hover:bg-amber-700" },
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
    // No overflow-hidden on the outer card — lets the popup escape
    <div className="bg-[#13131F] rounded-xl border border-[#1E1E30]
                    hover:border-[#3A3A5A] transition-all flex flex-col group relative">

      {/* Cover — has its own overflow-hidden + rounded top */}
      <Link to={`/books/${book.external_id}`}
            className="block relative aspect-[2/3] bg-[#1A1A2E] overflow-hidden
                       rounded-t-xl flex-shrink-0">
        {book.cover_url
          ? <img src={book.cover_url} alt={book.title}
                 className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm">No cover</div>
        }

        {/* Content badge — top left */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>

        {/* Star rating — bottom left */}
        {book.rating && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold
                           text-white bg-[#0A0A10] rounded-full px-2 py-0.5">
            ★ {Number(book.rating).toFixed(1)}
          </span>
        )}
      </Link>

      {/* Save / Fav buttons — positioned on the card (not inside the clipped Link) */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20" ref={promptRef}>
        <button onClick={handleSave}
                className="w-7 h-7 bg-[#1A1A2A] hover:bg-brand rounded-full flex items-center
                           justify-center text-xs text-white transition-colors shadow-md"
                title={isAuthenticated ? "Save to Library" : "Sign up to save"}>
          🔖
        </button>
        <button onClick={handleFavorite}
                className="w-7 h-7 bg-[#1A1A2A] hover:bg-red-700 rounded-full flex items-center
                           justify-center text-xs text-white transition-colors shadow-md"
                title={isAuthenticated ? "Add to Favourites" : "Sign up to favourite"}>
          ♡
        </button>

        {/* Auth prompt — now fully visible, not clipped */}
        {prompt && (
          <div onClick={e => e.preventDefault()}
               className="absolute right-9 top-0 w-52 bg-[#0D0D16] border border-[#3A3A5A]
                          text-white text-xs rounded-xl p-4 z-30 shadow-2xl animate-fade-in">
            <p className="font-bold text-sm text-white mb-1 leading-snug">
              {prompt === "save" ? "Save books to your library" : "Favourite books you love"}
            </p>
            <p className="text-gray-400 mb-3 leading-relaxed text-[11px]">
              Create a free account to get started.
            </p>
            <button
              onClick={e => { e.preventDefault(); navigate("/register") }}
              className="w-full py-2 bg-brand text-white rounded-lg font-semibold
                         hover:bg-indigo-500 transition text-xs mb-1.5">
              Create account
            </button>
            <button
              onClick={e => { e.preventDefault(); navigate("/login") }}
              className="w-full py-1.5 border border-[#2A2A3A] text-gray-300 hover:text-white
                         hover:border-[#4A4A6A] rounded-lg transition text-[11px]">
              Already have one? Log in
            </button>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/books/${book.external_id}`}>
          <p className="text-xs font-semibold text-white truncate leading-tight hover:text-gray-300 transition-colors">
            {book.title}
          </p>
        </Link>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">
          {book.author || "Unknown author"}
        </p>

        {/* Genre left · Action right — pinned to bottom */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
          <span className="px-2 py-0.5 bg-[#1E1E2A] text-gray-400 text-[10px] font-medium
                           rounded-md truncate max-w-[80px] flex-shrink-0">
            {(book.genres || [])[0] || ""}
          </span>
          {action && (
            <Link to={`/books/${book.external_id}`}
                  className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold
                              transition-colors whitespace-nowrap ${action.cls}`}>
              {action.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

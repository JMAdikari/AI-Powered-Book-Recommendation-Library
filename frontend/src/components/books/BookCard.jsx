import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const BADGE = {
  full:    { label: "Free",        cls: "bg-green-500 text-white" },
  buy:     { label: "Buy",         cls: "bg-amber-500 text-white" },
  preview: { label: "Buy",         cls: "bg-amber-500 text-white" },
  none:    { label: "Unavailable", cls: "bg-gray-300 text-gray-600" },
}

export default function BookCard({ book, onSave, onFavorite }) {
  const { isAuthenticated } = useAuth()
  const badge = BADGE[book.content_type] || BADGE.none

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

        {/* Save / Favourite — always visible when authenticated */}
        {isAuthenticated && (
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onSave?.(book) }}
              className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center
                         text-base hover:bg-indigo-600 hover:text-white transition-colors"
              title="Save to Library"
            >
              🔖
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onFavorite?.(book) }}
              className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center
                         text-base hover:bg-red-500 hover:text-white transition-colors"
              title="Add to Favourites"
            >
              ♡
            </button>
          </div>
        )}
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

import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const BADGE = {
  full:    { label: "Full Text", cls: "bg-green-100 text-green-700" },
  preview: { label: "Preview",   cls: "bg-yellow-100 text-yellow-700" },
  none:    { label: "Buy",       cls: "bg-gray-100 text-gray-500" },
}

export default function BookCard({ book, onSave, onFavorite }) {
  const { isAuthenticated } = useAuth()
  const badge = BADGE[book.content_type] || BADGE.none

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition group">
      <Link to={`/books/${book.external_id}`}>
        {/* Cover */}
        <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📖</div>
          )}
          {/* Content-mode badge */}
          <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          {/* Save / Favorite overlay */}
          {isAuthenticated && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={(e) => { e.preventDefault(); onSave?.(book) }}
                className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-sm hover:bg-brand hover:text-white transition"
                title="Save to Library"
              >
                🔖
              </button>
              <button
                onClick={(e) => { e.preventDefault(); onFavorite?.(book) }}
                className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-sm hover:bg-red-500 hover:text-white transition"
                title="Favourite"
              >
                ♥
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Meta */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{book.title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{book.author || "Unknown author"}</p>
        {(book.genres || []).length > 0 && (
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 text-brand text-xs rounded-full">
            {book.genres[0]}
          </span>
        )}
      </div>
    </div>
  )
}

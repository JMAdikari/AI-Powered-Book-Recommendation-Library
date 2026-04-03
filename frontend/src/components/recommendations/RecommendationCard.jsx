import { Link, useNavigate } from "react-router-dom"

const CONTENT_BADGE = {
  full: { label: "Free",        className: "bg-green-100 text-green-700 border-green-200" },
  buy:  { label: "Buy",         className: "bg-amber-100  text-amber-700  border-amber-200"  },
  none: { label: "Unavailable", className: "bg-gray-100   text-gray-400   border-gray-200"   },
}

export default function RecommendationCard({ rec }) {
  const navigate = useNavigate()
  const { book, reason } = rec
  const ct      = book.content_type || "none"
  const badge   = CONTENT_BADGE[ct] || CONTENT_BADGE.none

  const handleAction = (e) => {
    e.preventDefault()
    if (ct === "full") {
      navigate(`/reader/${book.external_id}`)
    } else if (ct === "buy") {
      const url = book.buy_links?.amazon || book.buy_links?.google_books || book.buy_links?.open_library
      if (url) window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition overflow-hidden">
      <Link to={`/books/${book.external_id}`} className="flex gap-4 p-4">

        {/* Cover */}
        <div className="relative w-16 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📖</div>
          )}
          {/* Content badge top-left */}
          <span
            className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none
                        ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="font-semibold text-gray-900 truncate text-sm leading-snug">{book.title}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{book.author || "Unknown author"}</p>
            {reason && (
              <span className="mt-2 text-[11px] text-brand bg-indigo-50 rounded-lg px-2 py-1 inline-block
                               border border-indigo-100 leading-snug">
                ✨ {reason}
              </span>
            )}
          </div>

          {/* Action button */}
          <div className="mt-3">
            {ct === "full" && (
              <button
                onClick={handleAction}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white
                           hover:bg-green-700 transition"
              >
                Read Now
              </button>
            )}
            {ct === "buy" && (
              <button
                onClick={handleAction}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white
                           hover:bg-amber-600 transition"
              >
                Find to Buy
              </button>
            )}
            {ct === "none" && (
              <span className="text-xs text-gray-400 italic">Unavailable</span>
            )}
          </div>
        </div>

      </Link>
    </div>
  )
}

import { Link, useNavigate } from "react-router-dom"

const CONTENT_BADGE = {
  full: { label: "Free", cls: "bg-green-900/50 text-green-400 border-green-800/40" },
  buy:  { label: "Buy",  cls: "bg-amber-900/50  text-amber-400  border-amber-800/40"  },
  none: { label: "Unavailable", cls: "bg-[#1A1A2E] text-gray-500 border-[#2A2A3A]" },
}

export default function RecommendationCard({ rec }) {
  const navigate = useNavigate()
  const { book, reason } = rec
  const ct    = book.content_type || "none"
  const badge = CONTENT_BADGE[ct] || CONTENT_BADGE.none

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
    <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] hover:border-brand/30
                    transition overflow-hidden">
      <Link to={`/books/${book.external_id}`} className="flex gap-4 p-4">

        {/* Cover */}
        <div className="relative w-16 h-24 flex-shrink-0 bg-[#1A1A2E] rounded-xl overflow-hidden">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700 text-2xl">📖</div>
          )}
          <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5
                            rounded border leading-none ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="font-semibold text-white truncate text-sm leading-snug">{book.title}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{book.author || "Unknown author"}</p>
            {reason && (
              <span className="mt-2 text-[11px] text-brand bg-brand/10 rounded-lg px-2 py-1
                               inline-block border border-brand/20 leading-snug">
                ✨ {reason}
              </span>
            )}
          </div>

          <div className="mt-3">
            {ct === "full" && (
              <button
                onClick={handleAction}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-900/40
                           text-green-400 border border-green-800/40 hover:bg-green-800/50 transition"
              >
                📖 Read Now
              </button>
            )}
            {ct === "buy" && (
              <button
                onClick={handleAction}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-900/30
                           text-amber-400 border border-amber-800/40 hover:bg-amber-800/40 transition"
              >
                🛒 Find to Buy
              </button>
            )}
            {ct === "none" && (
              <span className="text-xs text-gray-600 italic">Unavailable</span>
            )}
          </div>
        </div>

      </Link>
    </div>
  )
}

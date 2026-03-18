import { Link } from "react-router-dom"

export default function RecommendationCard({ book, reason }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
      <Link to={`/books/${book.external_id}`} className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-16 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📖</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{book.title}</p>
          <p className="text-sm text-gray-500 truncate mt-0.5">{book.author || "Unknown author"}</p>
          {reason && (
            <p className="mt-2 text-xs text-brand bg-indigo-50 rounded-lg px-2 py-1 inline-block">
              {reason}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}

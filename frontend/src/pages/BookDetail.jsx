import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { bookService } from "../services/bookService"
import { SkeletonText } from "../components/ui/Skeleton"

const CONTENT_BADGE = {
  full:    { label: "Full Text Available", cls: "bg-green-100 text-green-700" },
  preview: { label: "Preview Available",  cls: "bg-yellow-100 text-yellow-700" },
  none:    { label: "No Free Text",        cls: "bg-gray-100 text-gray-500" },
}

export default function BookDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [book,    setBook]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    bookService.getById(id)
      .then(res => setBook(res.data.book))
      .catch(() => setError("Book not found"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-background px-4">
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex gap-6">
            <div className="w-40 aspect-[2/3] bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 pt-2">
              <SkeletonText lines={5} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-medium">{error || "Book not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-brand hover:underline text-sm"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const badge = CONTENT_BADGE[book.content_type] || CONTENT_BADGE.none

  return (
    <div className="pt-20 min-h-screen bg-background px-4">
      <div className="max-w-3xl mx-auto py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-brand mb-6 flex items-center gap-1 transition"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-6">

          {/* Cover */}
          <div className="flex-shrink-0 w-full sm:w-44">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full rounded-xl object-cover aspect-[2/3] shadow"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-100 rounded-xl flex items-center justify-center text-5xl text-gray-300 shadow">
                📖
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{book.title}</h1>
            <p className="text-sm text-gray-500 mb-4">
              {book.author || "Unknown author"}
            </p>

            {/* Content-mode badge */}
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${badge.cls}`}>
              {badge.label}
            </span>

            {/* Genres */}
            {book.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {book.genres.slice(0, 6).map(g => (
                  <span key={g} className="px-2 py-0.5 bg-indigo-50 text-brand text-xs rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-5 line-clamp-5">
                {book.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {book.content_type === "full" && (
                <button
                  onClick={() => navigate(`/reader/${book.external_id}`)}
                  className="px-5 py-2 bg-brand text-white text-sm font-semibold rounded-lg
                             hover:bg-indigo-700 transition shadow-sm"
                >
                  Read Now
                </button>
              )}
              {book.content_type === "preview" && book.content_url && (
                <a
                  href={book.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg
                             hover:bg-yellow-600 transition shadow-sm"
                >
                  Preview on Google Books
                </a>
              )}
              {book.content_type === "none" && (
                <a
                  href={`https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg
                             hover:bg-gray-800 transition shadow-sm"
                >
                  Find on Open Library
                </a>
              )}
              <button
                onClick={() => navigate(`/search?q=${encodeURIComponent(book.author || book.title)}`)}
                className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg
                           hover:border-brand hover:text-brand transition"
              >
                More like this
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

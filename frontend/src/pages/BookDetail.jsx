import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { bookService } from "../services/bookService"
import { libraryService } from "../services/libraryService"
import { useAuth } from "../context/AuthContext"
import { SkeletonText } from "../components/ui/Skeleton"

const STATUS_BADGE = {
  full:    { label: "Free to Read",  cls: "bg-green-100 text-green-700 border-green-200" },
  buy:     { label: "Available to Buy", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  preview: { label: "Preview Only",  cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  none:    { label: "Unavailable",   cls: "bg-gray-100 text-gray-500 border-gray-200" },
}

export default function BookDetail({ showToast }) {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const { isAuthenticated } = useAuth()
  const [book,    setBook]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [saved,      setSaved]      = useState(false)
  const [favorited,  setFavorited]  = useState(false)
  const [userBookId, setUserBookId] = useState(null)

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
            <div className="w-44 aspect-[2/3] bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
            <div className="flex-1 pt-2 space-y-3">
              <SkeletonText lines={6} />
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
          <button onClick={() => navigate(-1)} className="mt-4 text-brand hover:underline text-sm">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!isAuthenticated) { showToast?.("Sign in to save books", "info"); return }
    try {
      const res = await libraryService.addBook({ external_id: book.external_id })
      setSaved(true)
      setUserBookId(res.data.id)
      showToast?.("Saved to library", "success")
    } catch {
      showToast?.("Failed to save", "error")
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) { showToast?.("Sign in to favourite books", "info"); return }
    try {
      // Ensure book is saved first so we have a userBookId
      let ubId = userBookId
      if (!ubId) {
        const res = await libraryService.addBook({ external_id: book.external_id })
        ubId = res.data.id
        setSaved(true)
        setUserBookId(ubId)
      }
      await libraryService.toggleFavorite(ubId)
      setFavorited(f => !f)
      showToast?.(favorited ? "Removed from favourites" : "Added to favourites", "success")
    } catch {
      showToast?.("Failed to update favourite", "error")
    }
  }

  const badge    = STATUS_BADGE[book.content_type] || STATUS_BADGE.none
  const canRead  = book.content_type === "full"
  const canBuy   = book.content_type === "buy" || book.content_type === "preview"
  const buyLinks = book.buy_links || {}

  return (
    <div className="pt-20 min-h-screen bg-background px-4">
      <div className="max-w-3xl mx-auto py-8">

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-brand mb-6 flex items-center gap-1 transition"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-8">

          {/* Cover */}
          <div className="flex-shrink-0 w-full sm:w-48">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full rounded-xl object-cover aspect-[2/3] shadow-md"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-100 rounded-xl flex items-center
                              justify-center text-5xl text-gray-300 shadow-md">
                📖
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
              {book.title}
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              by {book.author || "Unknown author"}
            </p>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                              px-3 py-1 rounded-full border mb-4 w-fit ${badge.cls}`}>
              {canRead  && <span className="w-2 h-2 rounded-full bg-green-500" />}
              {canBuy   && <span className="w-2 h-2 rounded-full bg-amber-500" />}
              {!canRead && !canBuy && <span className="w-2 h-2 rounded-full bg-gray-400" />}
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
              <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-5">
                {book.description}
              </p>
            )}

            {/* ── Action buttons ── */}
            <div className="mt-auto space-y-3">

              {/* READ */}
              {canRead && (
                <button
                  onClick={() => navigate(`/reader/${book.external_id}`)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-500 text-white text-sm
                             font-semibold rounded-xl hover:bg-green-600 transition shadow-sm
                             flex items-center gap-2"
                >
                  📖 Read Now — Free
                </button>
              )}

              {/* BUY OPTIONS */}
              {canBuy && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
                    Buy or find this book
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {buyLinks.amazon && (
                      <a href={buyLinks.amazon} target="_blank" rel="noreferrer"
                         className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold
                                    rounded-lg hover:bg-amber-600 transition shadow-sm">
                        Amazon
                      </a>
                    )}
                    {buyLinks.google_books && (
                      <a href={buyLinks.google_books} target="_blank" rel="noreferrer"
                         className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold
                                    rounded-lg hover:bg-blue-600 transition shadow-sm">
                        Google Books
                      </a>
                    )}
                    {buyLinks.open_library && (
                      <a href={buyLinks.open_library} target="_blank" rel="noreferrer"
                         className="px-4 py-2 bg-gray-700 text-white text-sm font-semibold
                                    rounded-lg hover:bg-gray-800 transition shadow-sm">
                        Open Library
                      </a>
                    )}
                    {book.content_url && (book.content_type === "preview") && (
                      <a href={book.content_url} target="_blank" rel="noreferrer"
                         className="px-4 py-2 border border-gray-300 text-gray-700 text-sm
                                    font-medium rounded-lg hover:border-brand hover:text-brand transition">
                        Preview
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* UNAVAILABLE */}
              {!canRead && !canBuy && (
                <p className="text-sm text-gray-400 italic">
                  No digital version found. Try searching on{" "}
                  <a href={`https://www.worldcat.org/search?q=${encodeURIComponent(book.title)}`}
                     target="_blank" rel="noreferrer" className="text-brand hover:underline">
                    WorldCat
                  </a>{" "}to find it at a library.
                </p>
              )}

              {/* DIVIDER */}
              <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={handleSave}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition
                        ${saved
                          ? "border-green-400 text-green-600 bg-green-50"
                          : "border-gray-300 text-gray-700 hover:border-brand hover:text-brand"}`}
                    >
                      {saved ? "✓ Saved" : "🔖 Save to Library"}
                    </button>
                    <button
                      onClick={handleFavorite}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition
                        ${favorited
                          ? "border-red-400 text-red-500 bg-red-50"
                          : "border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500"}`}
                    >
                      {favorited ? "♥ Favourited" : "♡ Add to Favourites"}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    <button onClick={() => navigate("/login")} className="text-brand hover:underline">Sign in</button>{" "}
                    to save or favourite this book
                  </p>
                )}
                <button
                  onClick={() => navigate(`/search?q=${encodeURIComponent(book.author || book.title)}`)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium
                             rounded-lg hover:border-brand hover:text-brand transition"
                >
                  More like this
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

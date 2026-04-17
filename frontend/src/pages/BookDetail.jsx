import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { bookService } from "../services/bookService"
import { libraryService } from "../services/libraryService"
import { useAuth } from "../context/AuthContext"
import { SkeletonText } from "../components/ui/Skeleton"

const STATUS_BADGE = {
  full:    { label: "Free to Read",    cls: "bg-green-900 text-green-300 border-green-800",  dot: "bg-green-400" },
  buy:     { label: "Available to Buy",cls: "bg-amber-900 text-amber-300 border-amber-800",  dot: "bg-amber-400" },
  preview: { label: "Preview Only",    cls: "bg-yellow-900 text-yellow-300 border-yellow-800", dot: "bg-yellow-400" },
  none:    { label: "Unavailable",     cls: "bg-[#1E1E2A] text-gray-500 border-[#2A2A3A]",  dot: "bg-gray-600" },
}

export default function BookDetail({ showToast }) {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const { isAuthenticated } = useAuth()

  const [book,      setBook]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [saved,     setSaved]     = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [userBookId,setUserBookId]= useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    bookService.getById(id)
      .then(res => setBook(res.data.book))
      .catch(() => setError("Book not found"))
      .finally(() => setLoading(false))
  }, [id])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-[#0A0A10] px-4">
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-6 flex gap-6">
            <div className="w-44 aspect-[2/3] bg-[#1A1A2E] rounded-xl animate-pulse flex-shrink-0" />
            <div className="flex-1 pt-2 space-y-3">
              <SkeletonText lines={6} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !book) {
    return (
      <div className="pt-20 min-h-screen bg-[#0A0A10] flex items-center justify-center px-4">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 bg-[#1E1E2A] rounded-xl mx-auto mb-4" />
          <p className="font-medium text-white">{error || "Book not found"}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-brand hover:underline text-sm">
            Back
          </button>
        </div>
      </div>
    )
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
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
    <div className="pt-20 min-h-screen bg-[#0A0A10] px-4">
      <div className="max-w-3xl mx-auto py-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-white mb-6 flex items-center gap-1.5 transition"
        >
          ← Back
        </button>

        {/* Main card */}
        <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-6
                        flex flex-col sm:flex-row gap-8">

          {/* Cover */}
          <div className="flex-shrink-0 w-full sm:w-44">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full rounded-xl object-cover aspect-[2/3]"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-[#1A1A2E] rounded-xl flex items-center
                              justify-center text-gray-700 text-sm">
                No cover
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col">

            <h1 className="text-2xl font-bold text-white leading-tight mb-1">
              {book.title}
            </h1>
            <p className="text-sm text-gray-500 mb-5">
              by {book.author || "Unknown author"}
            </p>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                              px-3 py-1 rounded-full border mb-5 w-fit ${badge.cls}`}>
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>

            {/* Genres */}
            {book.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {book.genres.slice(0, 6).map(g => (
                  <span key={g}
                        className="px-2.5 py-0.5 bg-[#1E1E2A] text-gray-400 text-xs
                                   rounded-md border border-[#2A2A3A]">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-5">
                {book.description}
              </p>
            )}

            {/* ── Actions ─────────────────────────────────────────────── */}
            <div className="mt-auto space-y-4">

              {/* Read Now */}
              {canRead && (
                <button
                  onClick={() => navigate(`/reader/${book.external_id}`)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-800 text-green-100 text-sm
                             font-semibold rounded-xl hover:bg-green-700 transition"
                >
                  Read Now — Free
                </button>
              )}

              {/* Buy options */}
              {canBuy && (
                <div>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">
                    Buy or find this book
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {buyLinks.amazon && (
                      <a href={buyLinks.amazon} target="_blank" rel="noreferrer"
                         className="px-4 py-2 bg-amber-800 text-amber-100 text-sm font-semibold
                                    rounded-lg hover:bg-amber-700 transition">
                        Amazon
                      </a>
                    )}
                    {buyLinks.google_books && (
                      <a href={buyLinks.google_books} target="_blank" rel="noreferrer"
                         className="px-4 py-2 bg-blue-900 text-blue-200 text-sm font-semibold
                                    rounded-lg hover:bg-blue-800 transition">
                        Google Books
                      </a>
                    )}
                    {buyLinks.open_library && (
                      <a href={buyLinks.open_library} target="_blank" rel="noreferrer"
                         className="px-4 py-2 bg-[#1E1E2A] text-gray-300 text-sm font-semibold
                                    rounded-lg border border-[#2A2A3A] hover:border-[#3A3A5A]
                                    hover:text-white transition">
                        Open Library
                      </a>
                    )}
                    {book.content_url && book.content_type === "preview" && (
                      <a href={book.content_url} target="_blank" rel="noreferrer"
                         className="px-4 py-2 border border-[#2A2A3A] text-gray-400 text-sm
                                    font-medium rounded-lg hover:border-[#3A3A5A] hover:text-white transition">
                        Preview
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Unavailable */}
              {!canRead && !canBuy && (
                <p className="text-sm text-gray-600 italic">
                  No digital version found. Try{" "}
                  <a href={`https://www.worldcat.org/search?q=${encodeURIComponent(book.title)}`}
                     target="_blank" rel="noreferrer"
                     className="text-brand hover:underline">
                    WorldCat
                  </a>{" "}to find it at a library.
                </p>
              )}

              {/* Divider + Save / Fav / More like this */}
              <div className="border-t border-[#1E1E30] pt-4 flex flex-wrap gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={handleSave}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition
                        ${saved
                          ? "border-green-700 text-green-400 bg-green-900"
                          : "border-[#2A2A3A] text-gray-400 hover:border-[#3A3A5A] hover:text-white"}`}
                    >
                      {saved ? "Saved" : "🔖 Save to Library"}
                    </button>
                    <button
                      onClick={handleFavorite}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition
                        ${favorited
                          ? "border-red-700 text-red-400 bg-red-900"
                          : "border-[#2A2A3A] text-gray-400 hover:border-red-800 hover:text-red-400"}`}
                    >
                      {favorited ? "♥ Favourited" : "♡ Add to Favourites"}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-gray-600">
                    <button onClick={() => navigate("/login")}
                            className="text-brand hover:underline">
                      Sign in
                    </button>{" "}
                    to save or favourite this book
                  </p>
                )}
                <button
                  onClick={() => navigate(`/search?q=${encodeURIComponent(book.author || book.title)}`)}
                  className="px-4 py-2 border border-[#2A2A3A] text-gray-400 text-sm font-medium
                             rounded-lg hover:border-[#3A3A5A] hover:text-white transition"
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

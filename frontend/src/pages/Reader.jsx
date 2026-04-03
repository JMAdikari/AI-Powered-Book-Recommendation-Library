import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { bookService } from "../services/bookService"
import { libraryService } from "../services/libraryService"
import { useAuth } from "../context/AuthContext"

const THEMES = {
  cream:  { bg: "#FAF6EE", text: "#2C1F0E", toolbar: "#FFFDF7", border: "#E8DFC8", label: "Cream"  },
  white:  { bg: "#FFFFFF", text: "#1A1A1A", toolbar: "#F8F8F8", border: "#E5E5E5", label: "White"  },
  dark:   { bg: "#1C1C1E", text: "#E5E0D5", toolbar: "#2C2C2E", border: "#3A3A3C", label: "Dark"   },
}

const MIN_FONT = 14
const MAX_FONT = 28

export default function Reader({ showToast }) {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const { isAuthenticated } = useAuth()
  const contentRef          = useRef(null)

  const [text,         setText]         = useState("")
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [fontSize,     setFontSize]     = useState(18)
  const [theme,        setTheme]        = useState("cream")
  const [showSettings, setShowSettings] = useState(false)
  const [bookTitle,    setBookTitle]    = useState("")
  const [bookAuthor,   setBookAuthor]   = useState("")
  const [saved,        setSaved]        = useState(false)
  const [favorited,    setFavorited]    = useState(false)
  const [userBookId,   setUserBookId]   = useState(null)

  const t = THEMES[theme]

  const handleSave = async () => {
    if (!isAuthenticated) { showToast?.("Sign in to save books", "info"); return }
    try {
      const res = await libraryService.addBook({ external_id: id })
      setSaved(true)
      setUserBookId(res.data.id)
      showToast?.("Saved to library", "success")
    } catch { showToast?.("Failed to save", "error") }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) { showToast?.("Sign in to favourite books", "info"); return }
    try {
      let ubId = userBookId
      if (!ubId) {
        const res = await libraryService.addBook({ external_id: id })
        ubId = res.data.id
        setSaved(true)
        setUserBookId(ubId)
      }
      await libraryService.toggleFavorite(ubId)
      setFavorited(f => !f)
      showToast?.(favorited ? "Removed from favourites" : "Added to favourites", "success")
    } catch { showToast?.("Failed to update favourite", "error") }
  }

  useEffect(() => { fetchPage(1) }, [id]) // eslint-disable-line

  const fetchPage = async (p) => {
    setLoading(true)
    setError(null)
    setShowSettings(false)
    try {
      const res = await bookService.getContent(id, p)
      setText(res.data.text)
      setPage(res.data.page)
      setTotalPages(res.data.total_pages)
      if (res.data.title)  setBookTitle(res.data.title)
      if (res.data.author) setBookAuthor(res.data.author)
      setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load content.")
    } finally {
      setLoading(false)
    }
  }

  const percent = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: t.bg, color: t.text, transition: "background 0.3s, color 0.3s" }}>

      {/* ── Top toolbar ── */}
      <div
        className="sticky top-0 z-20 px-4 h-14 flex items-center justify-between border-b"
        style={{ backgroundColor: t.toolbar, borderColor: t.border }}
      >
        {/* Left: back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium opacity-60 hover:opacity-100 transition"
        >
          ← Back
        </button>

        {/* Centre: title */}
        <div className="flex-1 text-center px-4 hidden sm:block">
          {bookTitle && (
            <p className="text-sm font-semibold truncate opacity-80">{bookTitle}</p>
          )}
          {bookAuthor && (
            <p className="text-xs opacity-40 truncate">{bookAuthor}</p>
          )}
        </div>

        {/* Right: settings */}
        <button
          onClick={() => setShowSettings(s => !s)}
          className="flex items-center gap-1 text-sm font-medium opacity-60 hover:opacity-100 transition"
          title="Reading settings"
        >
          Aa
        </button>
      </div>

      {/* ── Settings panel (dropdown) ── */}
      {showSettings && (
        <div
          className="sticky top-14 z-10 px-6 py-4 border-b shadow-sm flex flex-wrap items-center gap-6"
          style={{ backgroundColor: t.toolbar, borderColor: t.border }}
        >
          {/* Font size */}
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-50 uppercase tracking-wide">Size</span>
            <button
              onClick={() => setFontSize(s => Math.max(MIN_FONT, s - 2))}
              className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold
                         hover:opacity-100 opacity-60 transition"
              style={{ borderColor: t.border }}
            >A-</button>
            <span className="text-sm w-10 text-center font-medium opacity-70">{fontSize}px</span>
            <button
              onClick={() => setFontSize(s => Math.min(MAX_FONT, s + 2))}
              className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold
                         hover:opacity-100 opacity-60 transition"
              style={{ borderColor: t.border }}
            >A+</button>
          </div>

          {/* Theme */}
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-50 uppercase tracking-wide">Theme</span>
            <div className="flex gap-2">
              {Object.entries(THEMES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  title={val.label}
                  className="w-7 h-7 rounded-full border-2 transition"
                  style={{
                    backgroundColor: val.bg,
                    borderColor: theme === key ? "#4F46E5" : val.border,
                    boxShadow: theme === key ? "0 0 0 2px #4F46E5" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="h-0.5 flex-shrink-0" style={{ backgroundColor: t.border }}>
        <div
          className="h-0.5 transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: "#4F46E5" }}
        />
      </div>

      {/* ── Floating save/fav panel (right side) ── */}
      {isAuthenticated && !loading && !error && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          <button
            onClick={handleSave}
            title={saved ? "Saved to Library" : "Save to Library"}
            className="w-11 h-11 rounded-full shadow-lg flex flex-col items-center justify-center
                       text-xs font-semibold transition-all"
            style={{
              backgroundColor: saved ? "#4F46E5" : t.toolbar,
              color:           saved ? "#fff"     : t.text,
              border:          `1px solid ${saved ? "#4F46E5" : t.border}`,
            }}
          >
            <span className="text-base leading-none">🔖</span>
            <span className="mt-0.5 opacity-80" style={{ fontSize: 9 }}>
              {saved ? "Saved" : "Save"}
            </span>
          </button>
          <button
            onClick={handleFavorite}
            title={favorited ? "Remove from Favourites" : "Add to Favourites"}
            className="w-11 h-11 rounded-full shadow-lg flex flex-col items-center justify-center
                       text-xs font-semibold transition-all"
            style={{
              backgroundColor: favorited ? "#EF4444" : t.toolbar,
              color:           favorited ? "#fff"     : t.text,
              border:          `1px solid ${favorited ? "#EF4444" : t.border}`,
            }}
          >
            <span className="text-base leading-none">{favorited ? "♥" : "♡"}</span>
            <span className="mt-0.5 opacity-80" style={{ fontSize: 9 }}>
              {favorited ? "Fav'd" : "Fav"}
            </span>
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div ref={contentRef} className="flex-1 overflow-auto">
        <div className="max-w-[680px] mx-auto px-6 sm:px-10 py-12">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading book…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center opacity-60">
              <p className="text-lg">Something went wrong</p>
              <p className="text-sm opacity-70">{error}</p>
              <button onClick={() => navigate(-1)} className="text-sm underline mt-2">← Go back</button>
            </div>
          )}

          {/* Book content */}
          {!loading && !error && (
            <article>
              {/* Title page on page 1 */}
              {page === 1 && bookTitle && (
                <div className="text-center mb-16 pb-12" style={{ borderBottom: `1px solid ${t.border}` }}>
                  <h1
                    className="font-bold leading-tight mb-4"
                    style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}
                  >
                    {bookTitle}
                  </h1>
                  {bookAuthor && (
                    <p className="italic opacity-60" style={{ fontFamily: "Georgia, serif", fontSize: "1rem" }}>
                      by {bookAuthor}
                    </p>
                  )}
                </div>
              )}

              {/* Text */}
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize:   `${fontSize}px`,
                  lineHeight: 1.95,
                  color:      t.text,
                  whiteSpace: "pre-wrap",
                  wordBreak:  "break-word",
                }}
              >
                {text}
              </div>
            </article>
          )}
        </div>
      </div>

      {/* ── Footer navigation ── */}
      {!loading && !error && (
        <div
          className="sticky bottom-0 z-10 border-t"
          style={{ backgroundColor: t.toolbar, borderColor: t.border }}
        >
          {/* Thin progress label */}
          <div className="flex items-center justify-center py-1.5 gap-2 opacity-40 text-xs">
            <span>Page {page} of {totalPages}</span>
            <span>·</span>
            <span>{percent}% complete</span>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between px-6 pb-4 gap-4">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium
                         disabled:opacity-25 disabled:cursor-not-allowed transition hover:opacity-80"
              style={{ borderColor: t.border }}
            >
              ← Previous
            </button>

            {/* Dot indicators — max 7 visible */}
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const dotPage = totalPages <= 7
                  ? i + 1
                  : Math.round(1 + (i / 6) * (totalPages - 1))
                const active = Math.abs(dotPage - page) < Math.max(1, totalPages / 14)
                return (
                  <button
                    key={i}
                    onClick={() => fetchPage(dotPage)}
                    className="rounded-full transition-all"
                    style={{
                      width:           active ? 8  : 6,
                      height:          active ? 8  : 6,
                      backgroundColor: active ? "#4F46E5" : t.border,
                      opacity:         active ? 1 : 0.5,
                    }}
                  />
                )
              })}
            </div>

            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         disabled:opacity-25 disabled:cursor-not-allowed transition hover:opacity-90"
              style={{ backgroundColor: "#4F46E5", color: "#fff" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

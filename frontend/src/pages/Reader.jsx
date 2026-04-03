import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { bookService } from "../services/bookService"

export default function Reader() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [text,       setText]       = useState("")
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [fontSize,   setFontSize]   = useState(18)
  const contentRef = useRef(null)

  useEffect(() => {
    fetchPage(1)
  }, [id]) // eslint-disable-line

  const fetchPage = async (p) => {
    setLoading(true)
    setError(null)
    try {
      const res = await bookService.getContent(id, p)
      setText(res.data.text)
      setPage(res.data.page)
      setTotalPages(res.data.total_pages)
      // Scroll to top of content on page change
      setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50)
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load content."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const percent = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0

  return (
    <div className="min-h-screen bg-reading flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2.5
                      flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-brand transition flex items-center gap-1"
        >
          ← Back
        </button>

        {/* Font size controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontSize(s => Math.max(12, s - 2))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                       text-xs font-bold hover:border-brand hover:text-brand transition"
            title="Decrease font size"
          >
            A-
          </button>
          <span className="text-xs text-gray-400 w-8 text-center">{fontSize}px</span>
          <button
            onClick={() => setFontSize(s => Math.min(28, s + 2))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                       text-xs font-bold hover:border-brand hover:text-brand transition"
            title="Increase font size"
          >
            A+
          </button>
        </div>

        <span className="text-xs text-gray-400">
          {page} / {totalPages} &nbsp;·&nbsp; {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 flex-shrink-0">
        <div
          className="h-1 bg-brand transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Scrollable content area */}
      <div ref={contentRef} className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {loading && (
            <div className="text-center py-24 text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">📖</div>
              <p className="text-sm">Loading…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-24 text-gray-400">
              <div className="text-4xl mb-4">😔</div>
              <p className="font-medium text-gray-600">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 text-brand hover:underline text-sm"
              >
                ← Go back
              </button>
            </div>
          )}

          {!loading && !error && (
            <div
              className="text-gray-800 leading-relaxed whitespace-pre-wrap"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize:   `${fontSize}px`,
                lineHeight: 1.9,
              }}
            >
              {text}
            </div>
          )}
        </div>
      </div>

      {/* Pagination footer */}
      {!loading && !error && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3
                        flex justify-between items-center shadow-sm">
          <button
            onClick={() => fetchPage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-1.5 rounded-lg border border-gray-300 text-sm
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:border-brand hover:text-brand transition"
          >
            ← Previous
          </button>

          <span className="text-xs text-gray-400">{percent}% read</span>

          <button
            onClick={() => fetchPage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-medium
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-indigo-700 transition"
          >
            Next →
          </button>
        </div>
      )}

    </div>
  )
}

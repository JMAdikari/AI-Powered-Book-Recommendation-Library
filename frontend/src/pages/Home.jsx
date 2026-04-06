import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { bookService } from "../services/bookService"
import BookCard from "../components/books/BookCard"
import { libraryService } from "../services/libraryService"

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Recommendations",
    desc: "Personalised picks powered by TF-IDF + cosine similarity — the more you read, the smarter it gets.",
    iconBg: "bg-brand/20", iconColor: "text-brand",
  },
  {
    icon: "📖",
    title: "Free Full-Text Reads",
    desc: "Read thousands of classic books directly in-browser with a clean, distraction-free reader.",
    iconBg: "bg-green-900/30", iconColor: "text-green-400",
  },
  {
    icon: "📚",
    title: "Personal Library",
    desc: "Save, track reading status, and favourite books — your collection always in sync.",
    iconBg: "bg-amber-900/30", iconColor: "text-amber-400",
  },
  {
    icon: "🔥",
    title: "Reading Streaks",
    desc: "Build daily reading habits. Track your streak and weekly progress on the dashboard.",
    iconBg: "bg-red-900/30", iconColor: "text-red-400",
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const navigate            = useNavigate()
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookService.search("", 1, true)
      .then(res => setPopular((res.data.books || []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (book) => {
    if (!isAuthenticated) { navigate("/register"); return }
    try { await libraryService.addBook({ external_id: book.external_id }) } catch {}
  }

  const handleFavorite = async (book) => {
    if (!isAuthenticated) { navigate("/register"); return }
    try { await libraryService.addBook({ external_id: book.external_id }) } catch {}
  }

  return (
    <div className="pt-16 min-h-screen bg-[#0A0A10]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand/10 rounded-full
                        blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-purple-900/20 rounded-full
                        blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center px-4 py-20 md:py-28">
          <span className="inline-block mb-4 px-4 py-1.5 bg-[#1A1A2E] text-brand text-xs font-semibold
                           rounded-full border border-brand/20 tracking-wide">
            ✨ AI-Powered · Free to Use
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Discover Books You'll{" "}
            <span className="text-brand">Love</span>
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            AI recommendations, thousands of free classic reads, and a personal library —
            all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/search")}
              className="px-7 py-3 bg-brand text-white rounded-xl font-semibold
                         hover:bg-indigo-500 transition shadow-lg shadow-brand/20"
            >
              Browse Books
            </button>
            {!isAuthenticated ? (
              <button
                onClick={() => navigate("/register")}
                className="px-7 py-3 border border-[#2A2A3A] text-gray-300 rounded-xl
                           font-semibold hover:bg-[#1A1A2E] hover:border-brand/40 transition"
              >
                Get AI Recommendations
              </button>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-7 py-3 border border-[#2A2A3A] text-gray-300 rounded-xl
                           font-semibold hover:bg-[#1A1A2E] hover:border-brand/40 transition"
              >
                My Dashboard →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title}
                 className="bg-[#13131F] rounded-2xl p-5 border border-[#1E1E30]
                            hover:border-brand/30 transition">
              <div className={`w-12 h-12 ${f.iconBg} rounded-2xl flex items-center justify-center
                               text-2xl mb-3`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular Free Reads ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Popular Free Reads</h2>
            <p className="text-sm text-gray-500 mt-0.5">Classic books available to read right now</p>
          </div>
          <Link to="/search" className="text-sm text-brand font-medium hover:text-indigo-400 transition">
            See all →
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-[#13131F] border border-[#1E1E30] animate-pulse">
                <div className="aspect-[2/3] bg-[#1A1A2E]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#1A1A2E] rounded w-3/4" />
                  <div className="h-2.5 bg-[#1A1A2E] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && popular.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {popular.map(book => (
              <BookCard
                key={book.external_id}
                book={book}
                onSave={handleSave}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="bg-gradient-to-r from-brand to-purple-500 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Ready for your personalised list?</h2>
            <p className="text-indigo-200 text-sm mb-6">
              Create a free account and let the AI learn what you love.
            </p>
            <Link
              to="/register"
              className="inline-block px-6 py-2.5 bg-white text-brand font-semibold
                         rounded-xl hover:bg-indigo-50 transition text-sm"
            >
              Get Started — It's Free
            </Link>
          </div>
        </section>
      )}

    </div>
  )
}

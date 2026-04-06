import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { recommendationService } from "../services/recommendationService"
import { progressService } from "../services/progressService"
import RecommendationCard from "../components/recommendations/RecommendationCard"

export default function Dashboard() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [recs,      setRecs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [source,    setSource]    = useState("")
  const [error,     setError]     = useState(null)
  const [stats,     setStats]     = useState(null)

  const fetchRecs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await recommendationService.get()
      setRecs(res.data.recommendations || [])
      setSource(res.data.source || "")
    } catch {
      setError("Could not load recommendations. Try refreshing.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await progressService.getWeekly()
      setStats(res.data)
    } catch {
      // stats are non-critical — silently ignore
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await recommendationService.refresh()
      setRecs(res.data.recommendations || [])
      setSource("refreshed")
    } catch {
      setError("Refresh failed. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRecs()
    fetchStats()
  }, [])

  const sourceLabel = {
    behavioral:       "Based on your reading history",
    cold_start:       "Based on your preferences",
    genre_preference: "Based on your preferences",
    refreshed:        "Freshly computed",
  }[source] || "Personalised for you"

  const streakMessage = (days) => {
    if (days === 0) return "Start reading today to build your streak!"
    if (days === 1) return "You read yesterday — keep the momentum!"
    if (days < 7)  return `${days}-day streak — you're on a roll!`
    if (days < 30) return `${days}-day streak — impressive consistency!`
    return `${days}-day streak — you're a reading champion!`
  }

  return (
    <div className="pt-20 min-h-screen bg-background px-4">
      <div className="max-w-5xl mx-auto py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, {user?.username} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">{sourceLabel}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm
                       font-medium rounded-xl hover:bg-indigo-700 transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />Refreshing…</>
              : <>↻ Refresh</>}
          </button>
        </div>

        {/* AI badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50
                           text-brand text-xs font-semibold rounded-full border border-indigo-100">
            ✨ AI-powered · TF-IDF + Cosine Similarity
          </span>
        </div>

        {/* ── Reading Stats Panel ─────────────────────────────────────── */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Streak card */}
            <div className={`rounded-2xl p-5 border flex items-center gap-4
              ${stats.streak_days > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-gray-50 border-gray-200"}`}
            >
              <div className="text-4xl leading-none">
                {stats.streak_days > 0 ? "🔥" : "📖"}
              </div>
              <div>
                <p className={`text-2xl font-bold ${stats.streak_days > 0 ? "text-amber-600" : "text-gray-500"}`}>
                  {stats.streak_days > 0 ? `${stats.streak_days}-day streak` : "No streak yet"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {streakMessage(stats.streak_days)}
                </p>
              </div>
            </div>

            {/* Weekly activity card */}
            <div className="rounded-2xl p-5 border bg-white border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                This week
              </p>
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.books_this_week}</p>
                  <p className="text-xs text-gray-400">books read</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pages_this_week}</p>
                  <p className="text-xs text-gray-400">pages</p>
                </div>
              </div>

              {/* 7-day dot activity */}
              <div className="flex items-end gap-1.5">
                {Object.entries(stats.daily_activity).map(([date, active]) => {
                  const label = new Date(date).toLocaleDateString("en-US", { weekday: "short" })
                  return (
                    <div key={date} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-lg transition-all ${
                          active
                            ? "bg-brand"
                            : "bg-gray-100"
                        }`}
                        title={date}
                      />
                      <span className="text-[9px] text-gray-400">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* ── Lifetime stats row ─────────────────────────────────────── */}
        {stats && (
          <div className="flex gap-4 mb-8 flex-wrap">
            {[
              { label: "Books saved",     value: stats.total_saved },
              { label: "Completed",       value: stats.total_completed },
              { label: "Favourites",      value: stats.total_favorites },
            ].map(item => (
              <div key={item.label}
                   className="flex-1 min-w-[80px] bg-white rounded-xl border border-gray-100
                              px-4 py-3 text-center">
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600
                          text-sm rounded-xl flex items-center justify-between">
            {error}
            <button onClick={fetchRecs} className="underline ml-4">Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-4 border border-gray-100">
                <div className="w-16 h-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-5 bg-gray-100 rounded-full animate-pulse w-2/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No recommendations */}
        {!loading && !error && recs.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300
                          p-12 text-center text-gray-400">
            <div className="text-5xl mb-4">🤖</div>
            <p className="font-semibold text-gray-700 text-lg mb-1">
              No recommendations yet
            </p>
            <p className="text-sm mb-6">
              Set your reading preferences so the AI knows what to recommend
            </p>
            <button
              onClick={() => navigate("/onboarding")}
              className="px-5 py-2.5 bg-brand text-white text-sm font-semibold
                         rounded-xl hover:bg-indigo-700 transition"
            >
              Set Preferences
            </button>
          </div>
        )}

        {/* Recommendation grid */}
        {!loading && recs.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide font-medium">
              {recs.length} recommendations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recs.map((rec, i) => (
                <RecommendationCard key={rec.book.external_id || i} rec={rec} />
              ))}
            </div>

            {/* How it works */}
            <div className="mt-10 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-sm font-semibold text-brand mb-1">How recommendations work</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                BookAI uses <strong>TF-IDF vectorization</strong> to convert book descriptions and
                genres into numeric vectors, then computes <strong>cosine similarity</strong> between
                books you've engaged with and the full catalog. Books you completed or favourited
                carry more weight than ones you only saved.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

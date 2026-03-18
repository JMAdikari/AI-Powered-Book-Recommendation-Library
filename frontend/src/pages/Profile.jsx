import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { Link } from "react-router-dom"

export default function Profile({ showToast }) {
  const { user }   = useAuth()
  const [stats,    setStats]   = useState(null)

  useEffect(() => {
    api.get("/auth/stats").then((res) => setStats(res.data.stats))
      .catch(() => showToast?.("Failed to load stats", "error"))
  }, [])

  const statCards = stats ? [
    { label: "Books Read",        value: stats.total_completed },
    { label: "Currently Reading", value: stats.currently_reading },
    { label: "Saved Books",       value: stats.total_saved },
    { label: "Favorites",         value: stats.total_favorites },
    { label: "Pages Read",        value: stats.total_pages_read },
    { label: "Day Streak",        value: stats.reading_streak_days, highlight: stats.reading_streak_days >= 7 },
  ] : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pt-24">
      <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
        <h1 className="text-2xl font-bold">{user?.username}</h1>
        <p className="text-gray-500 text-sm">{user?.email}</p>
      </div>

      <h2 className="text-lg font-semibold mb-4">Reading Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label}
            className={`bg-white rounded-xl p-5 shadow-sm text-center
              ${s.highlight ? "border-2 border-achievement" : ""}`}
          >
            <p className={`text-3xl font-bold ${s.highlight ? "text-achievement" : "text-brand"}`}>
              {s.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            {s.highlight && <p className="text-xs text-achievement mt-1">On fire!</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link to="/library"   className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          My Library
        </Link>
        <Link to="/dashboard" className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200">
          Dashboard
        </Link>
      </div>
    </div>
  )
}

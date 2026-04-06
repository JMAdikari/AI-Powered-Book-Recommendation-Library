import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { progressService } from "../services/progressService"
import api from "../services/api"

const GENRE_OPTIONS = [
  "Fiction", "Mystery", "Science Fiction", "Fantasy", "Romance",
  "Thriller", "Historical Fiction", "Biography", "Self-Help",
  "Horror", "Adventure", "Literary Fiction", "Poetry", "Philosophy",
]

export default function Profile({ showToast }) {
  const { user, refreshUser } = useAuth()
  const navigate              = useNavigate()

  const [stats,         setStats]         = useState(null)
  const [prefs,         setPrefs]         = useState(null)

  // — Edit profile state
  const [editingProfile,  setEditingProfile]  = useState(false)
  const [draftUsername,   setDraftUsername]   = useState("")
  const [draftEmail,      setDraftEmail]      = useState("")
  const [savingProfile,   setSavingProfile]   = useState(false)

  // — Change password state
  const [editingPassword,  setEditingPassword]  = useState(false)
  const [currentPassword,  setCurrentPassword]  = useState("")
  const [newPassword,      setNewPassword]      = useState("")
  const [confirmPassword,  setConfirmPassword]  = useState("")
  const [savingPassword,   setSavingPassword]   = useState(false)

  // — Preferences state
  const [editingPrefs, setEditingPrefs] = useState(false)
  const [draftGenres,  setDraftGenres]  = useState([])
  const [draftAuthor,  setDraftAuthor]  = useState("")
  const [savingPrefs,  setSavingPrefs]  = useState(false)

  useEffect(() => {
    progressService.getWeekly()
      .then(res => setStats(res.data))
      .catch(() => {})

    api.get("/auth/preferences")
      .then(res => {
        const p = res.data.preference
        setPrefs(p)
        setDraftGenres(p?.genres || [])
        setDraftAuthor((p?.favorite_authors || []).join(", "))
      })
      .catch(() => {})
  }, [])

  // Populate draft when opening profile editor
  const openProfileEdit = () => {
    setDraftUsername(user?.username || "")
    setDraftEmail(user?.email || "")
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    if (!draftUsername.trim() || !draftEmail.trim()) {
      showToast?.("Username and email are required", "error")
      return
    }
    setSavingProfile(true)
    try {
      await api.put("/auth/profile", {
        username: draftUsername.trim(),
        email:    draftEmail.trim().toLowerCase(),
      })
      await refreshUser()
      setEditingProfile(false)
      showToast?.("Profile updated", "success")
    } catch (err) {
      showToast?.(err.response?.data?.error || "Failed to update profile", "error")
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast?.("All password fields are required", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      showToast?.("New passwords do not match", "error")
      return
    }
    if (newPassword.length < 8) {
      showToast?.("New password must be at least 8 characters", "error")
      return
    }
    setSavingPassword(true)
    try {
      await api.put("/auth/password", {
        current_password: currentPassword,
        new_password:     newPassword,
      })
      setEditingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      showToast?.("Password changed successfully", "success")
    } catch (err) {
      showToast?.(err.response?.data?.error || "Failed to change password", "error")
    } finally {
      setSavingPassword(false)
    }
  }

  const cancelPassword = () => {
    setEditingPassword(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const toggleGenre = (g) => {
    setDraftGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    )
  }

  const savePrefs = async () => {
    setSavingPrefs(true)
    try {
      const authors = draftAuthor.split(",").map(s => s.trim()).filter(Boolean)
      const body    = { genres: draftGenres, favorite_authors: authors }
      await api.put("/auth/preferences", body)
      setPrefs({ ...prefs, ...body, favorite_authors: authors })
      setEditingPrefs(false)
      showToast?.("Preferences updated — recommendations will refresh on next visit", "success")
    } catch {
      showToast?.("Failed to save preferences", "error")
    } finally {
      setSavingPrefs(false)
    }
  }

  const streakLabel = stats?.streak_days > 0
    ? `${stats.streak_days}-day streak 🔥`
    : "No streak yet"

  return (
    <div className="pt-20 min-h-screen bg-background px-4">
      <div className="max-w-3xl mx-auto py-8 space-y-6">

        {/* ── User card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-brand text-white text-2xl font-bold
                          flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-100">
            {user?.username?.slice(0, 2).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{user?.username}</h1>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            {stats && (
              <span className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold
                               px-2.5 py-1 rounded-full
                               ${stats.streak_days > 0
                                 ? "bg-amber-100 text-amber-700 border border-amber-200"
                                 : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                {streakLabel}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 text-right">
            <Link
              to="/library"
              className="text-xs px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-indigo-700 transition"
            >
              My Library
            </Link>
            <Link
              to="/dashboard"
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* ── Stats grid ─────────────────────────────────────────── */}
        {stats && (
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Reading Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Books Saved",   value: stats.total_saved,     icon: "🔖" },
                { label: "Completed",     value: stats.total_completed,  icon: "✅" },
                { label: "Favourites",    value: stats.total_favorites,  icon: "♥" },
                { label: "Pages Read",    value: stats.pages_this_week,  icon: "📄", sub: "this week" },
              ].map(s => (
                <div key={s.label}
                     className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  {s.sub && <p className="text-[10px] text-gray-300">{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* 7-day activity */}
            <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Last 7 days
              </p>
              <div className="flex gap-2">
                {Object.entries(stats.daily_activity).map(([date, active]) => {
                  const label = new Date(date).toLocaleDateString("en-US", { weekday: "short" })
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-lg h-8 transition-all ${
                        active ? "bg-brand" : "bg-gray-100"}`}
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

        {/* ── Edit Profile ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Account Details</h2>
            {!editingProfile && (
              <button
                onClick={openProfileEdit}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg
                           text-gray-600 hover:border-brand hover:text-brand transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {!editingProfile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20">Username</span>
                <span className="text-sm font-medium text-gray-800">{user?.username}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20">Email</span>
                <span className="text-sm text-gray-800">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20">Member since</span>
                <span className="text-sm text-gray-500">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Username</label>
                <input
                  type="text"
                  value={draftUsername}
                  onChange={e => setDraftUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-brand bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  value={draftEmail}
                  onChange={e => setDraftEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-brand bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl
                             hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 border border-gray-200 text-sm text-gray-600
                             rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Change Password ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Password</h2>
            {!editingPassword && (
              <button
                onClick={() => setEditingPassword(true)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg
                           text-gray-600 hover:border-brand hover:text-brand transition"
              >
                Change Password
              </button>
            )}
          </div>

          {!editingPassword ? (
            <p className="text-sm text-gray-400">••••••••••••</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-brand bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-brand bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 text-sm border rounded-xl
                              focus:outline-none focus:ring-2 focus:ring-brand bg-gray-50 focus:bg-white
                              ${confirmPassword && newPassword !== confirmPassword
                                ? "border-red-300 focus:ring-red-300"
                                : "border-gray-200"}`}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={savePassword}
                  disabled={savingPassword}
                  className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl
                             hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {savingPassword ? "Saving…" : "Update Password"}
                </button>
                <button
                  onClick={cancelPassword}
                  className="px-4 py-2 border border-gray-200 text-sm text-gray-600
                             rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Preferences section ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Reading Preferences</h2>
            {!editingPrefs && (
              <button
                onClick={() => setEditingPrefs(true)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg
                           text-gray-600 hover:border-brand hover:text-brand transition"
              >
                Edit Preferences
              </button>
            )}
          </div>

          {!editingPrefs ? (
            <>
              {prefs?.genres?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {prefs.genres.map(g => (
                    <span key={g}
                          className="px-3 py-1 bg-indigo-50 text-brand text-xs font-medium
                                     rounded-full border border-indigo-100">
                      {g}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-3">No genres selected yet.</p>
              )}
              {prefs?.favorite_authors?.length > 0 && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Favourite authors: </span>
                  {prefs.favorite_authors.join(", ")}
                </p>
              )}
              {!prefs && (
                <p className="text-sm text-gray-400">
                  You haven't set preferences yet.{" "}
                  <button
                    onClick={() => navigate("/onboarding")}
                    className="text-brand hover:underline"
                  >
                    Set them now
                  </button>{" "}
                  to get better recommendations.
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Genre chips */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Genres (select all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition
                        ${draftGenres.includes(g)
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-gray-600 border-gray-300 hover:border-brand hover:text-brand"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favourite authors */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Favourite authors <span className="text-gray-400 font-normal">(comma-separated)</span>
                </p>
                <input
                  type="text"
                  value={draftAuthor}
                  onChange={e => setDraftAuthor(e.target.value)}
                  placeholder="e.g. Agatha Christie, J.R.R. Tolkien"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-brand bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={savePrefs}
                  disabled={savingPrefs}
                  className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl
                             hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {savingPrefs ? "Saving…" : "Save Preferences"}
                </button>
                <button
                  onClick={() => {
                    setEditingPrefs(false)
                    setDraftGenres(prefs?.genres || [])
                    setDraftAuthor((prefs?.favorite_authors || []).join(", "))
                  }}
                  className="px-4 py-2 border border-gray-200 text-sm text-gray-600
                             rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

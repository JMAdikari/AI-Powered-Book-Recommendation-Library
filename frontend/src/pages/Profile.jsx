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

  const [editingProfile,  setEditingProfile]  = useState(false)
  const [draftUsername,   setDraftUsername]   = useState("")
  const [draftEmail,      setDraftEmail]      = useState("")
  const [savingProfile,   setSavingProfile]   = useState(false)

  const [editingPassword,  setEditingPassword]  = useState(false)
  const [currentPassword,  setCurrentPassword]  = useState("")
  const [newPassword,      setNewPassword]      = useState("")
  const [confirmPassword,  setConfirmPassword]  = useState("")
  const [savingPassword,   setSavingPassword]   = useState(false)

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

  const openProfileEdit = () => {
    setDraftUsername(user?.username || "")
    setDraftEmail(user?.email || "")
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    if (!draftUsername.trim() || !draftEmail.trim()) {
      showToast?.("Username and email are required", "error"); return
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
      showToast?.("All password fields are required", "error"); return
    }
    if (newPassword !== confirmPassword) {
      showToast?.("New passwords do not match", "error"); return
    }
    if (newPassword.length < 8) {
      showToast?.("New password must be at least 8 characters", "error"); return
    }
    setSavingPassword(true)
    try {
      await api.put("/auth/password", { current_password: currentPassword, new_password: newPassword })
      setEditingPassword(false)
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
      showToast?.("Password changed successfully", "success")
    } catch (err) {
      showToast?.(err.response?.data?.error || "Failed to change password", "error")
    } finally {
      setSavingPassword(false)
    }
  }

  const cancelPassword = () => {
    setEditingPassword(false)
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
  }

  const toggleGenre = (g) =>
    setDraftGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const savePrefs = async () => {
    setSavingPrefs(true)
    try {
      const authors = draftAuthor.split(",").map(s => s.trim()).filter(Boolean)
      const body    = { genres: draftGenres, favorite_authors: authors }
      await api.put("/auth/preferences", body)
      setPrefs({ ...prefs, ...body, favorite_authors: authors })
      setEditingPrefs(false)
      showToast?.("Preferences updated", "success")
    } catch {
      showToast?.("Failed to save preferences", "error")
    } finally {
      setSavingPrefs(false)
    }
  }

  const STAT_CARDS = stats ? [
    { label: "Books Saved",       value: stats.total_saved,     border: "border-b-brand",      icon: "📚", iconBg: "bg-brand/20",      iconColor: "text-brand" },
    { label: "Completed",         value: stats.total_completed, border: "border-b-green-600",  icon: "✅", iconBg: "bg-green-900/30",  iconColor: "text-green-400" },
    { label: "Favourites",        value: stats.total_favorites, border: "border-b-red-500",    icon: "❤️", iconBg: "bg-red-900/30",    iconColor: "text-red-400" },
    { label: "Pages This Week",   value: stats.pages_this_week, border: "border-b-blue-500",   icon: "📄", iconBg: "bg-blue-900/30",   iconColor: "text-blue-400" },
  ] : []

  return (
    <div className="pt-20 min-h-screen bg-[#0A0A10] px-4">
      <div className="max-w-3xl mx-auto py-8 space-y-4">

        {/* ── Hero card ─────────────────────────────────────────── */}
        <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand via-purple-400 to-cyan-400" />
          <div className="p-6 flex items-center gap-5">
            {/* Avatar with online dot */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-brand text-white text-2xl font-bold
                              flex items-center justify-center shadow-lg shadow-brand/20">
                {user?.username?.slice(0, 2).toUpperCase() || "?"}
              </div>
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full
                               border-2 border-[#13131F]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{user?.username}</h1>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              {stats && (
                <span className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold
                                 px-2.5 py-1 rounded-full border
                                 ${stats.streak_days > 0
                                   ? "bg-amber-900/30 text-amber-400 border-amber-800/40"
                                   : "bg-[#1A1A2E] text-gray-500 border-[#2A2A3A]"}`}>
                  🔥 {stats.streak_days > 0 ? `${stats.streak_days}-day streak` : "No streak yet"}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/library"
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-brand text-white
                               rounded-xl hover:bg-indigo-500 transition font-medium">
                📚 My Library
              </Link>
              <Link to="/dashboard"
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#1A1A2E] text-gray-300
                               rounded-xl hover:bg-[#2A2A3A] transition border border-[#2A2A3A]">
                ↗ Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* ── Reading Statistics ─────────────────────────────────── */}
        {stats && (
          <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              ↗ Reading Statistics
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {STAT_CARDS.map(s => (
                <div key={s.label}
                     className={`bg-[#0D0D16] rounded-xl p-4 text-center border-b-2 border-x-0
                                 border-t-0 border border-[#1E1E30] ${s.border}`}>
                  <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center
                                   text-lg mx-auto mb-2`}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* 7-day activity */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                📅 LAST 7 DAYS
              </p>
              <div className="flex gap-2">
                {Object.entries(stats.daily_activity).map(([date, active]) => {
                  const label = new Date(date).toLocaleDateString("en-US", { weekday: "short" })
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className={`w-full rounded-xl h-12 transition-all ${
                        active ? "bg-brand shadow-lg shadow-brand/20" : "bg-[#1A1A2E]"}`}
                        title={date}
                      />
                      <span className="text-[9px] text-gray-600">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Account Details ────────────────────────────────────── */}
        <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white">Account Details</h2>
            {!editingProfile && (
              <button
                onClick={openProfileEdit}
                className="text-xs px-3 py-1.5 border border-[#2A2A3A] rounded-lg
                           text-gray-500 hover:border-brand hover:text-brand transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {!editingProfile ? (
            <div className="space-y-4">
              {[
                { label: "Username",     value: user?.username },
                { label: "Email",        value: user?.email },
                { label: "Member since", value: user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "—" },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4">
                  <span className="text-xs text-gray-600 w-24 flex-shrink-0">{row.label}</span>
                  <span className="text-sm text-gray-200">{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Username</label>
                <input
                  type="text"
                  value={draftUsername}
                  onChange={e => setDraftUsername(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#2A2A3A] rounded-xl
                             bg-[#0D0D16] text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={draftEmail}
                  onChange={e => setDraftEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#2A2A3A] rounded-xl
                             bg-[#0D0D16] text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={savingProfile}
                        className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl
                                   hover:bg-indigo-500 transition disabled:opacity-50">
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={() => setEditingProfile(false)}
                        className="px-4 py-2 border border-[#2A2A3A] text-sm text-gray-400
                                   rounded-xl hover:bg-[#1A1A2E] transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Change Password ────────────────────────────────────── */}
        <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white">Password</h2>
            {!editingPassword && (
              <button
                onClick={() => setEditingPassword(true)}
                className="text-xs px-3 py-1.5 border border-[#2A2A3A] rounded-lg
                           text-gray-500 hover:border-brand hover:text-brand transition"
              >
                Change Password
              </button>
            )}
          </div>

          {!editingPassword ? (
            <p className="text-sm text-gray-700 tracking-widest">••••••••••••</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Current password",    val: currentPassword, set: setCurrentPassword, auto: "current-password" },
                { label: "New password",         val: newPassword,     set: setNewPassword,     auto: "new-password" },
                { label: "Confirm new password", val: confirmPassword, set: setConfirmPassword,  auto: "new-password" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">{f.label}</label>
                  <input
                    type="password"
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    autoComplete={f.auto}
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-[#0D0D16] text-white
                                focus:outline-none focus:ring-2 focus:ring-brand
                                ${f.label.includes("Confirm") && confirmPassword && newPassword !== confirmPassword
                                  ? "border-red-600" : "border-[#2A2A3A]"}`}
                  />
                  {f.label.includes("Confirm") && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={savePassword} disabled={savingPassword}
                        className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl
                                   hover:bg-indigo-500 transition disabled:opacity-50">
                  {savingPassword ? "Saving…" : "Update Password"}
                </button>
                <button onClick={cancelPassword}
                        className="px-4 py-2 border border-[#2A2A3A] text-sm text-gray-400
                                   rounded-xl hover:bg-[#1A1A2E] transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Reading Preferences ────────────────────────────────── */}
        <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white">Reading Preferences</h2>
            {!editingPrefs && (
              <button
                onClick={() => setEditingPrefs(true)}
                className="text-xs px-3 py-1.5 border border-[#2A2A3A] rounded-lg
                           text-gray-500 hover:border-brand hover:text-brand transition"
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
                          className="px-3 py-1 bg-[#1A1A3A] text-brand text-xs font-medium
                                     rounded-full border border-brand/20">
                      {g}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-3">No genres selected yet.</p>
              )}
              {prefs?.favorite_authors?.length > 0 && (
                <p className="text-xs text-gray-500">
                  <span className="text-gray-400 font-medium">Favourite authors: </span>
                  {prefs.favorite_authors.join(", ")}
                </p>
              )}
              {!prefs && (
                <p className="text-sm text-gray-500">
                  No preferences set.{" "}
                  <button onClick={() => navigate("/onboarding")} className="text-brand hover:underline">
                    Set them now
                  </button>
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition
                        ${draftGenres.includes(g)
                          ? "bg-brand text-white border-brand"
                          : "bg-transparent text-gray-400 border-[#2A2A3A] hover:border-brand hover:text-brand"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  Favourite authors <span className="text-gray-600">(comma-separated)</span>
                </p>
                <input
                  type="text"
                  value={draftAuthor}
                  onChange={e => setDraftAuthor(e.target.value)}
                  placeholder="e.g. Agatha Christie, J.R.R. Tolkien"
                  className="w-full px-3 py-2.5 text-sm border border-[#2A2A3A] rounded-xl
                             bg-[#0D0D16] text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={savePrefs} disabled={savingPrefs}
                        className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl
                                   hover:bg-indigo-500 transition disabled:opacity-50">
                  {savingPrefs ? "Saving…" : "Save Preferences"}
                </button>
                <button
                  onClick={() => {
                    setEditingPrefs(false)
                    setDraftGenres(prefs?.genres || [])
                    setDraftAuthor((prefs?.favorite_authors || []).join(", "))
                  }}
                  className="px-4 py-2 border border-[#2A2A3A] text-sm text-gray-400
                             rounded-xl hover:bg-[#1A1A2E] transition"
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

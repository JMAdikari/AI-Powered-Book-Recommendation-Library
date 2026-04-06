import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function Avatar({ username }) {
  const initials = username ? username.slice(0, 2).toUpperCase() : "?"
  return (
    <div className="w-8 h-8 rounded-full bg-brand text-white text-xs font-bold
                    flex items-center justify-center flex-shrink-0 select-none">
      {initials}
    </div>
  )
}

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch,  setShowSearch]  = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])

  const handleLogout = () => { logout(); navigate("/") }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
    setSearchQuery("")
    setShowSearch(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A10]/95 backdrop-blur
                      border-b border-[#1E1E30] z-40 px-4">
        <div className="max-w-6xl mx-auto h-full flex items-center gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white text-sm font-bold">
              📚
            </div>
            <span className="text-lg font-bold text-white">BookAI</span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm items-center relative">
            <span className="absolute left-3 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, author or genre..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#1E1E30] rounded-xl
                         bg-[#13131F] text-gray-200 placeholder-gray-600
                         focus:outline-none focus:ring-2 focus:ring-brand transition"
            />
          </form>

          <div className="flex-1" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: "/search",    label: "Browse" },
              ...(isAuthenticated ? [
                { to: "/dashboard", label: "Dashboard" },
                { to: "/library",   label: "Library"   },
              ] : []),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors
                  ${isActive(to)
                    ? "bg-brand text-white"
                    : "text-gray-400 hover:text-white"}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                  <Avatar username={user?.username} />
                  <span className="text-sm font-medium text-gray-300 hidden lg:block">
                    {user?.username}
                  </span>
                  <span className="text-gray-600 text-xs hidden lg:block">▾</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 border border-[#1E1E30] rounded-lg
                             text-gray-500 hover:text-white hover:border-gray-500 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-4 py-1.5 bg-brand text-white rounded-xl
                             font-medium hover:bg-indigo-500 transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile icons */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button onClick={() => setShowSearch(v => !v)}
                    className="p-2 text-gray-500 hover:text-white transition" aria-label="Search">
              🔍
            </button>
            <button onClick={() => setMenuOpen(v => !v)}
                    className="p-2 text-gray-500 hover:text-white transition" aria-label="Menu">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {showSearch && (
          <div className="md:hidden border-t border-[#1E1E30] px-4 py-2 bg-[#0A0A10]">
            <form onSubmit={handleSearch} className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search books…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#1E1E30] rounded-xl
                           bg-[#13131F] text-gray-200 placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </form>
          </div>
        )}
      </nav>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden"
             onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`fixed top-16 left-0 right-0 bg-[#0D0D16] border-b border-[#1E1E30]
                      z-40 md:hidden transition-all duration-200 overflow-hidden
                      ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 py-3 flex flex-col gap-1">
          {isAuthenticated && (
            <div className="flex items-center gap-3 py-2 border-b border-[#1E1E30] mb-1">
              <Avatar username={user?.username} />
              <div>
                <p className="text-sm font-semibold text-white">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          )}
          <MobileLink to="/search"    label="Browse"    active={isActive("/search")} />
          {isAuthenticated && (
            <>
              <MobileLink to="/dashboard" label="Dashboard" active={isActive("/dashboard")} />
              <MobileLink to="/library"   label="Library"   active={isActive("/library")} />
              <MobileLink to="/profile"   label="Profile"   active={isActive("/profile")} />
            </>
          )}
          {!isAuthenticated && (
            <>
              <MobileLink to="/login"    label="Login"   active={isActive("/login")} />
              <MobileLink to="/register" label="Sign up" active={isActive("/register")} accent />
            </>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="mt-2 text-sm text-left text-red-400 py-2 hover:text-red-300 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function MobileLink({ to, label, active, accent }) {
  return (
    <Link
      to={to}
      className={`text-sm py-2.5 px-3 rounded-xl font-medium transition
        ${active  ? "bg-brand text-white"
        : accent  ? "text-brand"
        : "text-gray-400 hover:text-white hover:bg-[#1A1A2E]"}`}
    >
      {label}
    </Link>
  )
}

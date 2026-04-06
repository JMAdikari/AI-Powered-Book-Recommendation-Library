import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function Avatar({ username }) {
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "?"
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

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Focus search input when it opens
  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
    setSearchQuery("")
    setShowSearch(false)
  }

  const isActive = (path) => location.pathname === path

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        isActive(to)
          ? "text-brand"
          : "text-gray-600 hover:text-brand"
      }`}
    >
      {label}
    </Link>
  )

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur
                      border-b border-gray-200 z-40 px-4">
        <div className="max-w-6xl mx-auto h-full flex items-center gap-4">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-brand flex-shrink-0 mr-2">
            📚 BookAI
          </Link>

          {/* Desktop: inline search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-sm items-center relative"
          >
            <span className="absolute left-3 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search books…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl
                         bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
                         focus:ring-brand transition"
            />
          </form>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5">
            {navLink("/search", "Browse")}
            {isAuthenticated && navLink("/dashboard", "Dashboard")}
            {isAuthenticated && navLink("/library",   "Library")}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                  <Avatar username={user?.username} />
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">
                    {user?.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg
                             text-gray-600 hover:bg-gray-50 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-brand transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-4 py-1.5 bg-brand text-white rounded-xl
                             font-medium hover:bg-indigo-700 transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: search icon + hamburger */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button
              onClick={() => setShowSearch(v => !v)}
              className="p-2 text-gray-500 hover:text-brand transition"
              aria-label="Search"
            >
              🔍
            </button>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 text-gray-500 hover:text-brand transition"
              aria-label="Menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>

        </div>

        {/* Mobile search bar (slides down) */}
        {showSearch && (
          <div className="md:hidden border-t border-gray-100 px-4 py-2 bg-white">
            <form onSubmit={handleSearch} className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search books…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl
                           bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
                           focus:ring-brand"
              />
            </form>
          </div>
        )}
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <div
        className={`fixed top-16 left-0 right-0 bg-white border-b border-gray-200
                    z-40 md:hidden transition-all duration-200 overflow-hidden
                    ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          {isAuthenticated && (
            <div className="flex items-center gap-3 py-2 border-b border-gray-100 mb-1">
              <Avatar username={user?.username} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
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
              className="mt-2 text-sm text-left text-red-500 py-2 hover:text-red-600 transition"
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
        ${active  ? "bg-indigo-50 text-brand"
        : accent  ? "text-brand"
        : "text-gray-700 hover:bg-gray-50"}`}
    >
      {label}
    </Link>
  )
}

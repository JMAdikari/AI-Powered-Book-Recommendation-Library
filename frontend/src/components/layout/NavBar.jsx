import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 px-4 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="text-xl font-bold text-brand">BookAI</Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
        <Link to="/search"    className="hover:text-brand transition">Browse</Link>
        {isAuthenticated && (
          <>
            <Link to="/dashboard" className="hover:text-brand transition">Dashboard</Link>
            <Link to="/library"   className="hover:text-brand transition">Library</Link>
          </>
        )}
      </div>

      {/* Auth */}
      <div className="hidden md:flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="text-sm font-medium text-gray-700 hover:text-brand">
              {user?.username}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login"    className="text-sm font-medium text-gray-700 hover:text-brand">Login</Link>
            <Link to="/register" className="text-sm px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-indigo-700 transition">
              Sign up
            </Link>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
        <span className="text-2xl">☰</span>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 flex flex-col p-4 gap-3 md:hidden">
          <Link to="/search"    onClick={() => setMenuOpen(false)} className="text-sm font-medium">Browse</Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm font-medium">Dashboard</Link>
              <Link to="/library"   onClick={() => setMenuOpen(false)} className="text-sm font-medium">Library</Link>
              <Link to="/profile"   onClick={() => setMenuOpen(false)} className="text-sm font-medium">Profile</Link>
              <button onClick={handleLogout} className="text-sm text-left text-red-500">Logout</button>
            </>
          )}
          {!isAuthenticated && (
            <>
              <Link to="/login"    onClick={() => setMenuOpen(false)} className="text-sm font-medium">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-brand">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

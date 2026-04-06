import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { login as loginService } from "../services/authService"

export default function Login({ showToast }) {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form,     setForm]    = useState({ email: "", password: "" })
  const [error,    setError]   = useState(null)
  const [loading,  setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await loginService(form)
      login(res.data.access_token, res.data.user)
      showToast?.("Welcome back!", "success")
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A10] px-4">
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white font-bold">📚</div>
          <span className="text-xl font-bold text-white">BookAI</span>
        </div>

        <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your BookAI account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/40 text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm
                           bg-[#0D0D16] text-white placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-brand transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm
                           bg-[#0D0D16] text-white placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-brand transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm
                         hover:bg-indigo-500 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-5 text-center">
            No account?{" "}
            <Link to="/register" className="text-brand hover:text-indigo-400 font-medium transition">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

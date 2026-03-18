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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in to BookAI</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
          <input
            type="password" placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-brand text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-4 text-center">
          No account? <Link to="/register" className="text-brand hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}

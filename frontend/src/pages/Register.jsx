import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { register as registerService } from "../services/authService"

export default function Register({ showToast }) {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ email: "", username: "", password: "" })
  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setLoading(true)
    try {
      await registerService(form)
      showToast?.("Account created! Please sign in.", "success")
      navigate("/login")
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A10] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white text-sm font-bold">B</div>
          <span className="text-xl font-bold text-white">BookAI</span>
        </div>

        <div className="bg-[#13131F] rounded-2xl border border-[#1E1E30] p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Join BookAI and discover your next great read</p>

          {error && (
            <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Email",    name: "email",    type: "email",    placeholder: "you@example.com" },
              { label: "Username", name: "username", type: "text",     placeholder: "bookworm42" },
              { label: "Password", name: "password", type: "password", placeholder: "Min. 8 characters" },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required
                  className="w-full border border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm
                             bg-[#0D0D16] text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-brand transition"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white rounded-xl py-2.5 text-sm font-semibold
                         hover:bg-indigo-500 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-medium hover:text-indigo-400 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

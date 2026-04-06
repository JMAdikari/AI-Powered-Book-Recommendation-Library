import { createContext, useContext, useState, useEffect } from "react"
import { getMe } from "../services/authService"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem("access_token"))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem("access_token", token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    setUser(null)
  }

  const refreshUser = () =>
    getMe().then(res => setUser(res.data.user)).catch(() => {})

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

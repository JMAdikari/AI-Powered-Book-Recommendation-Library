import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { useToast } from "./components/ui/Toast"
import ToastContainer from "./components/ui/Toast"
import NavBar from "./components/layout/NavBar"
import ProtectedRoute from "./components/layout/ProtectedRoute"

import Home       from "./pages/Home"
import Search     from "./pages/Search"
import BookDetail from "./pages/BookDetail"
import Reader     from "./pages/Reader"
import Login      from "./pages/Login"
import Register   from "./pages/Register"
import Onboarding from "./pages/Onboarding"
import Dashboard  from "./pages/Dashboard"
import Library    from "./pages/Library"
import Profile    from "./pages/Profile"

export default function App() {
  const { toasts, show: showToast } = useToast()

  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          {/* Public */}
          <Route path="/"          element={<Home />} />
          <Route path="/search"    element={<Search />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/reader/:id" element={<Reader />} />
          <Route path="/login"     element={<Login    showToast={showToast} />} />
          <Route path="/register"  element={<Register showToast={showToast} />} />

          {/* Protected */}
          <Route path="/onboarding" element={
            <ProtectedRoute><Onboarding showToast={showToast} /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/library" element={
            <ProtectedRoute><Library /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile showToast={showToast} /></ProtectedRoute>
          } />
        </Routes>
        <ToastContainer toasts={toasts} />
      </BrowserRouter>
    </AuthProvider>
  )
}

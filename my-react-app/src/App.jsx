import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader" aria-label="Loading RALL-E" />
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader" aria-label="Loading RALL-E" />
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/login" element={<GuestRoute><AuthPage mode="login" /></GuestRoute>} />
    <Route path="/signup" element={<GuestRoute><AuthPage mode="signup" /></GuestRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></AuthProvider>
}

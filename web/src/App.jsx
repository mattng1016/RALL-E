import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './auth.css'
import Layout from './components/Layout'
import { getCurrentUser } from './lib/api'
import { AuthProvider, useAuth } from './lib/auth'
import AuthPage from './pages/AuthPage'
import CreateSession from './pages/CreateSession'
import Discover from './pages/Discover'
import MySessions from './pages/MySessions'
import Onboarding from './pages/Onboarding'
import SessionDetail from './pages/SessionDetail'

function Loader() {
  return <div className="page-loader" aria-label="Loading RALL-E" />
}

function RequireUser() {
  const { authEnabled, authUser, profile, loading } = useAuth()
  if (!authEnabled) return getCurrentUser() ? <Outlet /> : <Navigate to="/onboarding" replace />
  if (loading) return <Loader />
  if (!authUser) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function RequireAccount() {
  const { authEnabled, authUser, loading } = useAuth()
  if (!authEnabled) return <Outlet />
  if (loading) return <Loader />
  return authUser ? <Outlet /> : <Navigate to="/login" replace />
}

function GuestOnly() {
  const { authEnabled, authUser, loading } = useAuth()
  if (!authEnabled) return <Navigate to="/onboarding" replace />
  if (loading) return <Loader />
  return authUser ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
          </Route>
          <Route element={<RequireAccount />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          <Route element={<RequireUser />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Discover />} />
              <Route path="/sessions/:id" element={<SessionDetail />} />
              <Route path="/create" element={<CreateSession />} />
              <Route path="/my-sessions" element={<MySessions />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

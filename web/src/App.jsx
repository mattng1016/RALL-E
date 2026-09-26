import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { getCurrentUser } from './lib/api'
import CreateSession from './pages/CreateSession'
import Discover from './pages/Discover'
import MySessions from './pages/MySessions'
import Onboarding from './pages/Onboarding'
import SessionDetail from './pages/SessionDetail'

function RequireUser() {
  return getCurrentUser() ? <Outlet /> : <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
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
    </BrowserRouter>
  )
}

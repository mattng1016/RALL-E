import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getCurrentUser, syncCurrentUser, usingMockData } from '../lib/api'
import { signOut, useAuth } from '../lib/auth'
import SessionChatLauncher from './SessionChatLauncher'

function navClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`
}

export default function Layout() {
  const user = getCurrentUser()
  const { authEnabled } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    syncCurrentUser()
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <Link to="/" className="text-xl font-black tracking-tight">
          RALL-E
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>
            Discover
          </NavLink>
          <NavLink to="/my-sessions" className={navClass}>
            My sessions
          </NavLink>
          <NavLink to="/create" className={navClass}>
            + Create session
          </NavLink>
          <Link to="/onboarding" className="ml-2 text-sm text-slate-500 hover:underline">
            {user?.name}
          </Link>
          {authEnabled && (
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          )}
        </nav>
      </header>

      {usingMockData && (
        <div className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
          Using mock data: add web/.env to connect Supabase
        </div>
      )}

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
      <SessionChatLauncher />
    </div>
  )
}

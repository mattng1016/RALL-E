import BrandWordmark from './BrandWordmark'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getCurrentUser, syncCurrentUser, usingMockData } from '../lib/api'
import { signOut, useAuth } from '../lib/auth'
import SessionChatLauncher from './SessionChatLauncher'

function navClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-navy text-brand-cream' : 'hover:bg-brand-navy/5'}`
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
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-brand-navy/20 bg-brand-cream px-4 py-3">
        <Link to="/" className="brand-home" aria-label="RALL-E home">
          <BrandWordmark />
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={navClass}>
            Discover
          </NavLink>
          <NavLink to="/my-sessions" className={navClass}>
            My sessions
          </NavLink>
          <NavLink to="/create" className={navClass}>
            + Create session
          </NavLink>
          <Link to="/onboarding" className="ml-2 text-sm text-brand-navy/75 hover:underline">
            {user?.name}
          </Link>
          {authEnabled && (
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-1 rounded-lg border border-brand-navy/20 px-3 py-1.5 text-sm text-brand-navy/75 hover:bg-brand-navy/5"
            >
              Log out
            </button>
          )}
        </nav>
      </header>

      {usingMockData && (
        <div className="bg-brand-orange px-4 py-1 text-center text-xs text-brand-navy">
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

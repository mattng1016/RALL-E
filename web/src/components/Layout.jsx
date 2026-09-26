import { Link, NavLink, Outlet } from 'react-router-dom'
import { getCurrentUser, usingMockData } from '../lib/api'

function navClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`
}

export default function Layout() {
  const user = getCurrentUser()

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
          <NavLink to="/create" className={navClass}>
            + Create session
          </NavLink>
          <Link to="/onboarding" className="ml-2 text-sm text-slate-500 hover:underline">
            {user?.name}
          </Link>
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
    </div>
  )
}

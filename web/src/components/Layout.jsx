import BrandWordmark from './BrandWordmark'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { getCurrentUser, syncCurrentUser, usingMockData } from '../lib/api'
import SessionChatLauncher from './SessionChatLauncher'

function navClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-navy text-brand-cream' : 'hover:bg-brand-navy/5'}`
}

export default function Layout() {
  const user = getCurrentUser()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)

  useEffect(() => {
    syncCurrentUser()
  }, [])

  useEffect(() => {
    if (!accountMenuOpen) return undefined
    function handlePointerDown(event) {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen])

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-[1300] flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-brand-navy/20 bg-brand-cream px-4 py-3">
        <Link to="/" className="brand-home" aria-label="RALL-E home">
          <BrandWordmark />
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Discover
            </NavLink>
            <NavLink to="/my-sessions" className={navClass}>
              My sessions
            </NavLink>
            <NavLink to="/create" className={navClass}>
              + Create session
            </NavLink>
          </nav>
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 focus:outline-none focus:ring-2 focus:ring-brand-navy/40"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1A265A] text-xs font-bold text-[#97FB57]" aria-hidden="true">
                {user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P'}
              </span>
              <span className="hidden sm:block">{user?.name ?? 'Account'}</span>
              <span aria-hidden="true" className="text-xs text-brand-navy/75">⌄</span>
            </button>
            {accountMenuOpen && (
              <div role="menu" className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-brand-navy/20 bg-brand-cream p-1.5 shadow-lg">
                <Link role="menuitem" to="/profile" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-navy hover:bg-brand-navy/5">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-brand-navy/75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
                  </svg>
                  Profile
                </Link>
                <Link role="menuitem" to="/settings" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-navy hover:bg-brand-navy/5">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-brand-navy/75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
                  </svg>
                  Settings
                </Link>
              </div>
            )}
          </div>
        </div>
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

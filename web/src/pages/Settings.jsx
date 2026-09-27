import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../lib/api'
import { signOut, useAuth } from '../lib/auth'

export default function Settings() {
  const { authEnabled, authUser } = useAuth()
  const navigate = useNavigate()
  const profile = getCurrentUser()
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setError('')
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not log out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-8">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-5 py-4 sm:px-7">
          <p className="text-sm font-semibold text-[#50A5B1]">ACCOUNT</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your account and profile privacy.</p>
        </header>
        <div className="space-y-6 p-5 sm:p-7">
          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-slate-800">Account</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">{profile?.name ?? 'Player'}</dd>
              </div>
              {authUser?.email && <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
                <dd className="mt-1 break-all text-sm font-medium text-slate-800">{authUser.email}</dd>
              </div>}
            </dl>
          </section>

          <section className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Sign out</h2>
              <p className="mt-1 text-sm text-slate-500">Log out of your RALL-E account on this device.</p>
            </div>
            {authEnabled ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-60"
              >
                {signingOut ? 'Logging out…' : 'Log out'}
              </button>
            ) : (
              <p className="text-sm text-slate-500">Sign-out is available when you’re signed in with Supabase.</p>
            )}
          </section>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      </section>
    </div>
  )
}

import BrandWordmark from '../components/BrandWordmark'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, saveUser } from '../lib/api'
import { useAuth } from '../lib/auth'
import { LEVELS, SPORT_EMOJI, SPORTS } from '../lib/constants'
import { capitalize } from '../lib/format'

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-w-0 flex-1 rounded-xl border px-2 py-3 text-sm font-medium transition-colors sm:px-4 sm:text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy ${selected ? 'border-brand-navy bg-brand-navy text-brand-cream' : 'border-brand-navy/25 bg-brand-cream text-brand-navy hover:border-brand-navy'}`}
    >
      {children}
    </button>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { authUser, refreshProfile } = useAuth()
  const existing = getCurrentUser()
  const [name, setName] = useState(existing?.name ?? authUser?.user_metadata?.name ?? '')
  const [sport, setSport] = useState(existing?.sport ?? 'badminton')
  const [level, setLevel] = useState(existing?.level ?? 'beginner')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await saveUser({ id: authUser?.id, name: name.trim(), sport, level, bio: existing?.bio ?? '' })
      if (authUser) await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-brand-cream p-4 text-brand-navy sm:p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-2xl border border-brand-navy/15 bg-brand-cream p-6 shadow-sm shadow-brand-navy/10 sm:p-8">
        <div>
          <h1 className="mb-3"><BrandWordmark /></h1>
          <p className="text-brand-navy/75">Find people to play with, wherever you are.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Your name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-brand-navy/25 bg-brand-cream px-3 py-2 placeholder:text-brand-navy/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
            placeholder="Mai"
          />
        </label>

        <div className="space-y-1">
          <span className="text-sm font-medium">Sport</span>
          <div className="flex gap-2">
            {SPORTS.map((s) => (
              <OptionButton key={s} selected={sport === s} onClick={() => setSport(s)}>
                {SPORT_EMOJI[s]} {capitalize(s)}
              </OptionButton>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium">Level</span>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <OptionButton key={l} selected={level === l} onClick={() => setLevel(l)}>
                {capitalize(l)}
              </OptionButton>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg border-l-4 border-brand-orange bg-brand-orange/10 p-3 text-sm text-brand-navy">{error}</p>}

        <button
          disabled={saving}
          className="w-full rounded-xl bg-brand-lime py-3 font-semibold text-brand-navy transition-colors hover:bg-brand-lime/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Find sessions'}
        </button>
      </form>
    </div>
  )
}

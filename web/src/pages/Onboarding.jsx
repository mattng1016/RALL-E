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
      className={`flex-1 rounded-xl border px-4 py-3 font-medium ${selected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white hover:border-slate-500'}`}
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
      await saveUser({ id: authUser?.id, name: name.trim(), sport, level })
      if (authUser) await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow">
        <div>
          <h1 className="text-3xl font-black">RALL-E</h1>
          <p className="text-slate-500">Find people to play with, wherever you are.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Your name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Find sessions'}
        </button>
      </form>
    </div>
  )
}

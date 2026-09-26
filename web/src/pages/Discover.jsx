import { useEffect, useState } from 'react'
import SessionCard from '../components/SessionCard'
import SessionMap from '../components/SessionMap'
import { getCurrentUser, getSessions } from '../lib/api'
import { LEVELS, SPORTS } from '../lib/constants'
import { capitalize } from '../lib/format'

export default function Discover() {
  const user = getCurrentUser()
  const [sport, setSport] = useState(user?.sport ?? '')
  const [level, setLevel] = useState('')
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    getSessions({ sport, level })
      .then(setSessions)
      .catch((err) => setError(err.message))
  }, [sport, level])

  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="flex max-h-[45%] flex-col border-slate-200 md:max-h-none md:w-96 md:border-r">
        <div className="flex gap-2 border-b border-slate-200 p-3">
          <select value={sport} onChange={(e) => setSport(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-2 py-1">
            <option value="">All sports</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {capitalize(s)}
              </option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-2 py-1">
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {capitalize(l)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && sessions.length === 0 && <p className="text-sm text-slate-500">No open sessions match these filters.</p>}
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </aside>

      <section className="min-h-0 flex-1">
        <SessionMap sessions={sessions} />
      </section>
    </div>
  )
}

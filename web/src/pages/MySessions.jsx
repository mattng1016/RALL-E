import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SessionCard from '../components/SessionCard'
import { getCurrentUser, getMySessions, subscribeToChanges } from '../lib/api'

export default function MySessions() {
  const user = getCurrentUser()
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(
    () =>
      getMySessions(user.id)
        .then(setSessions)
        .catch((err) => setError(err.message)),
    [user.id],
  )

  useEffect(() => {
    load()
    return subscribeToChanges([{ table: 'sessions' }, { table: 'session_participants' }], load)
  }, [load])

  if (error) return <p className="p-6 text-red-600">{error}</p>
  if (!sessions) return <p className="p-6 text-slate-500">Loading…</p>

  const now = new Date().toISOString()
  const upcoming = sessions.filter((s) => s.start_time >= now)
  const past = sessions.filter((s) => s.start_time < now).reverse()

  function tagFor(session) {
    return session.host_id === user.id ? 'Hosting' : 'Joined'
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-2xl font-bold">My sessions</h1>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-medium">You haven't joined any upcoming sessions yet.</p>
            <p className="mt-1 text-sm text-slate-500">Find a game near you and meet people who play at your level.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              Find a session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session) => (
              <SessionCard key={session.id} session={session} tag={tagFor(session)} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-900">
              Past sessions ({past.length})
            </summary>
            <div className="mt-3 space-y-3 opacity-75">
              {past.map((session) => (
                <SessionCard key={session.id} session={session} tag={tagFor(session)} />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

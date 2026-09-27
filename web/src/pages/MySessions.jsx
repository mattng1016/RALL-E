import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SessionCard from '../components/SessionCard'
import { getCurrentUser, getMySessions, subscribeToChanges } from '../lib/api'

export default function MySessions() {
  const navigate = useNavigate()
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

  if (error) return <p className="p-6 text-brand-navy">{error}</p>
  if (!sessions) return <p className="p-6 text-brand-navy/75">Loading…</p>

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
          <div className="rounded-xl border border-dashed border-brand-navy/20 bg-brand-cream p-8 text-center">
            <p className="font-medium">You haven't joined any upcoming sessions yet.</p>
            <p className="mt-1 text-sm text-brand-navy/75">Find a game near you and meet people who play at your level.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-xl bg-brand-lime px-5 py-2 font-semibold text-brand-navy hover:bg-brand-lime/80"
            >
              Find a session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                tag={tagFor(session)}
                onClick={() => navigate(`/sessions/${session.id}`)}
              />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-brand-navy/75 hover:text-brand-navy">
              Past sessions ({past.length})
            </summary>
            <div className="mt-3 space-y-3 opacity-75">
              {past.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  tag={tagFor(session)}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

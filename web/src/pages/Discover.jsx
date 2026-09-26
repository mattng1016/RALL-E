import { useCallback, useEffect, useState } from 'react'
import SessionCard from '../components/SessionCard'
import SessionMap from '../components/SessionMap'
import { getCurrentUser, getSessions, subscribeToChanges } from '../lib/api'
import { LEVELS, SPORTS } from '../lib/constants'
import { capitalize } from '../lib/format'

export default function Discover() {
  const user = getCurrentUser()
  const [sport, setSport] = useState(user?.sport ?? '')
  const [level, setLevel] = useState('')
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)
  const [listOpen, setListOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [focusRequest, setFocusRequest] = useState(null)

  const load = useCallback(
    () =>
      getSessions({ sport, level })
        .then(setSessions)
        .catch((err) => setError(err.message)),
    [sport, level],
  )

  useEffect(() => {
    load()
    return subscribeToChanges([{ table: 'sessions' }, { table: 'session_participants' }], load)
  }, [load])

  return (
    <div className="relative h-full overflow-hidden">
      <section className="absolute inset-0">
        <SessionMap
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          focusRequest={focusRequest}
          listOpen={listOpen}
          onSelect={setSelectedSessionId}
          onDeselect={(sessionId) => setSelectedSessionId((current) => (current === sessionId ? null : current))}
        />
      </section>

      {!listOpen && (
        <button
          type="button"
          aria-expanded={false}
          aria-controls="session-list-panel"
          onClick={() => setListOpen(true)}
          className="absolute left-3 top-3 z-[1000] inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold leading-none text-slate-900 shadow-lg transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <span aria-hidden="true">☰</span>
          Find a game
          {sessions.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-sm text-emerald-800">{sessions.length}</span>
          )}
        </button>
      )}

      <aside
        id="session-list-panel"
        aria-label="Available sessions"
        aria-hidden={!listOpen}
        inert={!listOpen}
        className={`absolute inset-y-0 left-0 z-[999] flex w-[min(32rem,calc(100%-1rem))] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out ${listOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {listOpen && (
          <button
            type="button"
            aria-expanded={true}
            aria-controls="session-list-panel"
            aria-label="Close game list"
            onClick={() => setListOpen(false)}
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
        <div className="border-b border-slate-200 px-4 pb-3 pt-3">
          <h1 className="text-xl font-bold">Games nearby</h1>
          <p className="mt-1 text-sm text-slate-500">Find a group and get out to play.</p>
        </div>
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
            <SessionCard
              key={session.id}
              session={session}
              selected={selectedSessionId === session.id}
              onClick={() => {
                setSelectedSessionId(session.id)
                setFocusRequest((current) => ({ sessionId: session.id, token: (current?.token ?? 0) + 1 }))
              }}
            />
          ))}
        </div>
      </aside>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import SessionCard from '../components/SessionCard'
import SessionMap from '../components/SessionMap'
import { getCurrentUser, getSessions, subscribeToChanges } from '../lib/api'
import { LEVELS, SPORT_EMOJI, SPORTS } from '../lib/constants'
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
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy })
        setLocationStatus('ready')
      },
      (error) => setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, maximumAge: 0, timeout: 12000 },
    )
  }

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
          userLocation={userLocation}
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
          className="absolute left-3 top-3 z-[1000] inline-flex items-center justify-center gap-3 rounded-xl border border-brand-navy/20 bg-brand-cream px-5 py-3 text-base font-semibold leading-none text-brand-navy shadow-lg transition hover:border-brand-navy/20 hover:bg-brand-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
        >
          <span aria-hidden="true">☰</span>
          Find a game
          {sessions.length > 0 && (
            <span className="rounded-full bg-brand-lime px-2.5 py-1 text-sm text-brand-navy">{sessions.length}</span>
          )}
        </button>
      )}

      <div className="absolute right-3 top-3 z-[1000] flex max-w-[min(19rem,calc(100%-1.5rem))] flex-col items-end gap-1">
        <button
          type="button"
          onClick={requestLocation}
          disabled={locationStatus === 'loading'}
          className="rounded-xl border border-brand-navy/20 bg-brand-cream px-4 py-3 text-sm font-semibold text-brand-navy shadow-lg transition hover:bg-brand-cream disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
        >
          {locationStatus === 'loading' ? 'Finding you…' : locationStatus === 'ready' ? 'Refresh my location' : '◎ Use my location'}
        </button>
        {locationStatus === 'denied' && <p role="status" className="rounded-lg bg-brand-cream/95 px-3 py-2 text-right text-xs text-brand-navy shadow">Location permission is off. You can enable it in browser settings.</p>}
        {locationStatus === 'unsupported' && <p role="status" className="rounded-lg bg-brand-cream/95 px-3 py-2 text-right text-xs text-brand-navy shadow">Location isn’t supported by this browser.</p>}
        {locationStatus === 'error' && <p role="status" className="rounded-lg bg-brand-cream/95 px-3 py-2 text-right text-xs text-brand-navy shadow">Couldn’t get your location. Please try again.</p>}
      </div>

      <aside
        id="session-list-panel"
        aria-label="Available sessions"
        aria-hidden={!listOpen}
        inert={!listOpen}
        className={`absolute inset-y-0 left-0 z-[999] flex w-[min(32rem,calc(100%-1rem))] flex-col border-r border-brand-navy/20 bg-brand-cream shadow-xl transition-transform duration-300 ease-out ${listOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {listOpen && (
          <button
            type="button"
            aria-expanded={true}
            aria-controls="session-list-panel"
            aria-label="Close game list"
            onClick={() => setListOpen(false)}
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-navy/20 bg-brand-cream text-xl leading-none text-brand-navy shadow-sm transition hover:bg-brand-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
        <div className="border-b border-brand-navy/20 px-4 pb-3 pt-3">
          <h1 className="text-xl font-bold">Games nearby</h1>
          <p className="mt-1 text-sm text-brand-navy/75">Find a group and get out to play.</p>
        </div>
        <div className="flex gap-2 border-b border-brand-navy/20 p-3">
          <select value={sport} onChange={(e) => setSport(e.target.value)} className="flex-1 rounded-lg border border-brand-navy/20 px-2 py-1">
            <option value="">All sports</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {SPORT_EMOJI[s]} {capitalize(s)}
              </option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="flex-1 rounded-lg border border-brand-navy/20 px-2 py-1">
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {capitalize(l)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {error && <p className="text-sm text-brand-navy">{error}</p>}
          {!error && sessions.length === 0 && <p className="text-sm text-brand-navy/75">No open sessions match these filters.</p>}
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              userLocation={userLocation}
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

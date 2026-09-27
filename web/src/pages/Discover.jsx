import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SessionCard from '../components/SessionCard'
import SessionMap from '../components/SessionMap'
import { getSessions, subscribeToChanges } from '../lib/api'
import { LEVELS, PROFILE_SPORTS } from '../lib/constants'
import { capitalize } from '../lib/format'

// The current demo courts don't store a city field. Prefer one if the database gains it;
// otherwise split the Vancouver-area demo coordinates into Vancouver and Richmond.
function getSessionCity(session) {
  if (session.court?.city) return session.court.city
  const { lat } = session.court ?? {}
  if (typeof lat !== 'number') return ''
  return lat < 49.21 ? 'Richmond' : 'Vancouver'
}

function distanceMeters(from, to) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const lat1 = radians(Number(from.lat))
  const lat2 = radians(Number(to.lat))
  const deltaLat = lat2 - lat1
  const deltaLng = radians(Number(to.lng) - Number(from.lng))
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function FilterDropdown({ label, value, placeholder, options, onChange, open, onOpenChange }) {
  const selected = options.find((option) => option.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-800 shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {(selected?.icon || (!value && label === 'Sport')) && <span aria-hidden="true">{selected?.icon ?? '🏅'}</span>}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div role="listbox" aria-label={label} className="absolute inset-x-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => { onChange(option.value); onOpenChange(false) }}
              className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${option.value === value ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {option.icon && <span className="grid h-6 w-6 shrink-0 place-items-center" aria-hidden="true">{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Discover() {
  const [sport, setSport] = useState('')
  const [level, setLevel] = useState('')
  const [city, setCity] = useState('')
  const [sortBy, setSortBy] = useState('time')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState({ sport: '', level: '', city: '' })
  const [draftSortBy, setDraftSortBy] = useState('time')
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null)
  const filtersButtonRef = useRef(null)
  const filterDialogRef = useRef(null)
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState(null)
  const [listOpen, setListOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [focusRequest, setFocusRequest] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const visibleSessions = useMemo(
    () => sessions
      .filter((session) => !city || getSessionCity(session) === city)
      .sort((first, second) => sortBy === 'distance' && userLocation
        ? distanceMeters(userLocation, first.court) - distanceMeters(userLocation, second.court)
        : new Date(first.start_time) - new Date(second.start_time)),
    [sessions, city, sortBy, userLocation],
  )
  const activeFilterCount = Number(Boolean(sport)) + Number(Boolean(level)) + Number(Boolean(city))

  function openFilters() {
    setDraftFilters({ sport, level, city })
    setDraftSortBy(sortBy)
    setFiltersOpen(true)
  }

  function applyFilters() {
    setSport(draftFilters.sport)
    setLevel(draftFilters.level)
    setCity(draftFilters.city)
    setSortBy(draftSortBy)
    setOpenFilterDropdown(null)
    setFiltersOpen(false)
  }

  function closeFilters() {
    setOpenFilterDropdown(null)
    setFiltersOpen(false)
  }

  useEffect(() => {
    if (!filtersOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const trigger = filtersButtonRef.current
    document.body.style.overflow = 'hidden'
    filterDialogRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') closeFilters()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [filtersOpen])

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
          sessions={visibleSessions}
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
          className="absolute left-3 top-3 z-[1000] inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold leading-none text-slate-900 shadow-lg transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <span aria-hidden="true">☰</span>
          Find a game
          {visibleSessions.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-sm text-emerald-800">{visibleSessions.length}</span>
          )}
        </button>
      )}

      <div className="absolute right-3 top-3 z-[1000] flex max-w-[min(19rem,calc(100%-1.5rem))] flex-col items-end gap-1">
        <button
          type="button"
          onClick={requestLocation}
          disabled={locationStatus === 'loading'}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {locationStatus === 'loading' ? 'Finding you…' : locationStatus === 'ready' ? 'Refresh my location' : '◎ Use my location'}
        </button>
        {locationStatus === 'denied' && <p role="status" className="rounded-lg bg-white/95 px-3 py-2 text-right text-xs text-slate-700 shadow">Location permission is off. You can enable it in browser settings.</p>}
        {locationStatus === 'unsupported' && <p role="status" className="rounded-lg bg-white/95 px-3 py-2 text-right text-xs text-slate-700 shadow">Location isn’t supported by this browser.</p>}
        {locationStatus === 'error' && <p role="status" className="rounded-lg bg-white/95 px-3 py-2 text-right text-xs text-slate-700 shadow">Couldn’t get your location. Please try again.</p>}
      </div>

      <aside
        id="session-list-panel"
        aria-label="Available sessions"
        aria-hidden={!listOpen}
        inert={!listOpen}
        className={`absolute inset-y-0 left-0 z-[999] flex w-[min(32rem,calc(100%-1rem))] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out ${listOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 pb-3 pt-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Games nearby</h1>
            <p className="mt-1 text-sm text-slate-500">Find a group and get out to play.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              ref={filtersButtonRef}
              aria-label={`Open filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
              onClick={openFilters}
              className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-3"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M3 5h14M5.5 10h9M8 15h4" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-slate-100 px-1 text-xs text-slate-600">{activeFilterCount}</span>}
            </button>
            <button
              type="button"
              aria-expanded={true}
              aria-controls="session-list-panel"
              aria-label="Close game list"
              onClick={() => setListOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-2xl leading-none text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && visibleSessions.length === 0 && <p className="text-sm text-slate-500">No open sessions match these filters.</p>}
          {visibleSessions.map((session) => (
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
      {filtersOpen && createPortal(
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeFilters() }}
        >
          <section ref={filterDialogRef} role="dialog" aria-modal="true" aria-labelledby="filter-dialog-title" tabIndex={-1} className="my-auto max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="filter-dialog-title" className="text-xl font-bold text-slate-900">Filter games</h2>
                <p className="mt-1 text-sm text-slate-500">Choose what you’re looking for.</p>
              </div>
              <button type="button" aria-label="Close filters" onClick={closeFilters} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div className="grid gap-1.5 text-sm font-semibold text-slate-700">
                <span>Sport</span>
                <FilterDropdown
                  label="Sport"
                  value={draftFilters.sport}
                  placeholder="All sports"
                  options={[{ value: '', label: 'All sports', icon: '🏅' }, ...PROFILE_SPORTS.map((item) => ({ value: item.id, label: item.label, icon: item.icon }))]}
                  onChange={(value) => setDraftFilters((current) => ({ ...current, sport: value }))}
                  open={openFilterDropdown === 'sport'}
                  onOpenChange={(open) => setOpenFilterDropdown(open ? 'sport' : null)}
                />
              </div>
              <div className="grid gap-1.5 text-sm font-semibold text-slate-700">
                <span>Level</span>
                <FilterDropdown
                  label="Level"
                  value={draftFilters.level}
                  placeholder="All levels"
                  options={[{ value: '', label: 'All levels' }, ...LEVELS.map((item) => ({ value: item, label: capitalize(item) }))]}
                  onChange={(value) => setDraftFilters((current) => ({ ...current, level: value }))}
                  open={openFilterDropdown === 'level'}
                  onOpenChange={(open) => setOpenFilterDropdown(open ? 'level' : null)}
                />
              </div>
              <div className="grid gap-1.5 text-sm font-semibold text-slate-700">
                <span>City</span>
                <FilterDropdown
                  label="City"
                  value={draftFilters.city}
                  placeholder="All cities"
                  options={[{ value: '', label: 'All cities' }, { value: 'Vancouver', label: 'Vancouver' }, { value: 'Richmond', label: 'Richmond' }]}
                  onChange={(value) => setDraftFilters((current) => ({ ...current, city: value }))}
                  open={openFilterDropdown === 'city'}
                  onOpenChange={(open) => setOpenFilterDropdown(open ? 'city' : null)}
                />
              </div>
              <fieldset className="space-y-2 border-t border-slate-100 pt-4">
                <legend className="text-sm font-semibold text-slate-700">Sort by</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <input type="radio" name="session-sort" value="time" checked={draftSortBy === 'time'} onChange={() => setDraftSortBy('time')} className="accent-slate-900" />
                  <span aria-hidden="true">◷</span>
                  <span className="font-medium">Soonest first</span>
                </label>
                <label className={`flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm ${userLocation ? 'cursor-pointer text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed text-slate-400'}`}>
                  <input type="radio" name="session-sort" value="distance" checked={draftSortBy === 'distance'} disabled={!userLocation} onChange={() => setDraftSortBy('distance')} className="accent-slate-900" />
                  <span aria-hidden="true">◎</span>
                  <span className="font-medium">Nearest to me</span>
                </label>
                {!userLocation && <div className="flex flex-wrap items-center justify-between gap-2 pl-1">
                  <p className="text-xs text-slate-500">Share your location to sort by distance.</p>
                  <button type="button" onClick={requestLocation} disabled={locationStatus === 'loading'} className="text-xs font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-950 disabled:opacity-50">{locationStatus === 'loading' ? 'Finding you…' : 'Use my location'}</button>
                  {locationStatus === 'denied' && <p role="status" className="w-full text-xs text-amber-700">Location access is off. Enable it in browser settings, then try again.</p>}
                  {(locationStatus === 'error' || locationStatus === 'unsupported') && <p role="status" className="w-full text-xs text-amber-700">Couldn’t access location. Try again from a supported browser.</p>}
                </div>}
              </fieldset>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => { setDraftFilters({ sport: '', level: '', city: '' }); setDraftSortBy('time'); setOpenFilterDropdown(null) }} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Reset</button>
              <div className="flex gap-2 sm:justify-end">
                <button type="button" onClick={closeFilters} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none">Cancel</button>
                <button type="button" onClick={applyFilters} className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 sm:flex-none">Apply filters</button>
              </div>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  )
}

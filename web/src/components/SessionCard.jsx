import { SPORT_EMOJI } from '../lib/constants'
import { capitalize, formatDateTime, formatPrice } from '../lib/format'

export default function SessionCard({ session, tag, selected = false, onClick }) {
  const spotsLeft = session.capacity - session.participant_count

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`block w-full rounded-xl border p-4 text-left shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${selected ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {SPORT_EMOJI[session.sport]} {session.court.name}
          </p>
          <p className="text-sm text-slate-500">{formatDateTime(session.start_time)}</p>
        </div>
        <span className="text-sm font-semibold">{formatPrice(session.price)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {tag && <span className="rounded-full bg-slate-900 px-2 py-1 text-white">{tag}</span>}
        <span className="rounded-full bg-slate-100 px-2 py-1">{capitalize(session.level)}</span>
        <span className={`rounded-full px-2 py-1 ${spotsLeft > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {spotsLeft > 0 ? `${spotsLeft} of ${session.capacity} spots left` : 'Full'}
        </span>
        {session.is_coach && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Coach</span>}
      </div>

      {session.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{session.description}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Hosted by {session.host?.name ?? 'a player'}</span>
        <span>{session.duration_min} min</span>
      </div>
    </button>
  )
}

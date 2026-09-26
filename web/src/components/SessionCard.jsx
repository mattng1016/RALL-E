import { Link } from 'react-router-dom'
import { SPORT_EMOJI } from '../lib/constants'
import { capitalize, formatDateTime, formatPrice } from '../lib/format'

export default function SessionCard({ session }) {
  const spotsLeft = session.capacity - session.participant_count

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {SPORT_EMOJI[session.sport]} {session.court.name}
          </p>
          <p className="text-sm text-slate-500">{formatDateTime(session.start_time)}</p>
        </div>
        <span className="text-sm font-semibold">{formatPrice(session.price)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-2 py-1">{capitalize(session.level)}</span>
        <span className={`rounded-full px-2 py-1 ${spotsLeft > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {spotsLeft > 0 ? `${spotsLeft} of ${session.capacity} spots left` : 'Full'}
        </span>
        {session.is_coach && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Coach</span>}
      </div>
    </Link>
  )
}

import { SPORT_EMOJI } from '../lib/constants'
import { capitalize, formatDateTime, formatPrice, formatDistance } from '../lib/format'

export default function SessionCard({ session, tag, userLocation, selected = false, onClick }) {
  const spotsLeft = session.capacity - session.participant_count
  const distance = formatDistance(userLocation, session.court)

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`block w-full rounded-xl border p-4 text-left shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy ${selected ? 'border-brand-orange bg-brand-orange/10' : 'border-brand-navy/20 bg-brand-cream hover:border-brand-navy/20 hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-brand-navy">
            {SPORT_EMOJI[session.sport]} {session.court.name}
          </p>
          <p className="text-sm text-brand-navy/75">{formatDateTime(session.start_time)}</p>
          {distance && <p className="mt-1 text-sm font-semibold text-brand-navy">{distance}</p>}
        </div>
        <span className="text-sm font-semibold">{formatPrice(session.price)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {tag && <span className="rounded-full bg-brand-navy px-2 py-1 text-brand-cream">{tag}</span>}
        <span className="rounded-full bg-brand-navy/5 px-2 py-1">{capitalize(session.level)}</span>
        <span className={`rounded-full px-2 py-1 ${spotsLeft > 0 ? 'bg-brand-lime text-brand-navy' : 'bg-brand-orange text-brand-navy'}`}>
          {spotsLeft > 0 ? `${spotsLeft} of ${session.capacity} spots left` : 'Full'}
        </span>
        {session.is_coach && <span className="rounded-full bg-brand-orange px-2 py-1 text-brand-navy">Coach</span>}
      </div>

      {session.description && <p className="mt-3 line-clamp-2 text-sm text-brand-navy/75">{session.description}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-brand-navy/20 pt-3 text-xs text-brand-navy/75">
        <span>Hosted by {session.host?.name ?? 'a player'}</span>
        <span>{session.duration_min} min</span>
      </div>
    </button>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getCurrentUser,
  getMessages,
  getSession,
  joinSession,
  leaveSession,
  sendMessage,
  subscribeToChanges,
} from '../lib/api'
import { SPORT_EMOJI } from '../lib/constants'
import { capitalize, formatDateTime, formatPrice, profilePreview } from '../lib/format'
import { hasStarted } from '../lib/sessionTime'

function Chat({ sessionId, user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  const load = useCallback(() => getMessages(sessionId).then(setMessages), [sessionId])

  useEffect(() => {
    load()
    return subscribeToChanges([{ table: 'messages', filter: `session_id=eq.${sessionId}` }], load)
  }, [load, sessionId])

  async function handleSend(event) {
    event.preventDefault()
    if (!text.trim()) return
    await sendMessage(sessionId, user.id, text.trim())
    setText('')
    load()
  }

  return (
    <div className="rounded-xl border border-brand-navy/20 bg-brand-cream">
      <h2 className="border-b border-brand-navy/20 px-4 py-2 font-semibold">Session chat</h2>
      <div className="max-h-72 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm text-brand-navy/75">No messages yet. Say hi!</p>}
        {messages.map((m) => (
          <p key={m.id} className="text-sm">
            <span className="font-semibold">{m.user?.name ?? 'Someone'}:</span> {m.text}
          </p>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-brand-navy/20 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="See you there!"
          className="flex-1 rounded-lg border border-brand-navy/25 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-brand-navy px-4 text-sm font-medium text-brand-cream">Send</button>
      </form>
    </div>
  )
}

export default function SessionDetail() {
  const { id } = useParams()
  const user = getCurrentUser()
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () =>
      getSession(id)
        .then(setSession)
        .catch((err) => setError(err.message)),
    [id],
  )

  useEffect(() => {
    load()
    return subscribeToChanges(
      [
        { table: 'sessions', filter: `id=eq.${id}` },
        // Unfiltered: Supabase Realtime can't filter DELETE events, so a filter would miss people leaving.
        { table: 'session_participants' },
      ],
      load,
    )
  }, [load, id])

  async function runAction(action) {
    setBusy(true)
    setError(null)
    try {
      await action(id, user.id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !session) return <p className="p-6 text-brand-orange">{error}</p>
  if (!session) return <p className="p-6 text-brand-navy/75">Loading…</p>

  const spotsLeft = session.capacity - session.participant_count
  const hasJoined = session.participants.some((p) => p.id === user.id)
  const isHost = session.host_id === user.id
  const started = hasStarted(session)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <div className="space-y-4 rounded-xl border border-brand-navy/20 bg-brand-cream p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {SPORT_EMOJI[session.sport]} {session.court.name}
              </h1>
              <p className="text-brand-navy/75">{formatDateTime(session.start_time)} · {session.duration_min} min</p>
            </div>
            {session.is_coach && <span className="rounded-full bg-brand-orange/20 px-3 py-1 text-sm text-amber-800">Coach session</span>}
          </div>

          <p>{session.description}</p>

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-brand-navy/75">Level</dt>
              <dd className="font-medium">{capitalize(session.level)}</dd>
            </div>
            <div>
              <dt className="text-brand-navy/75">Price</dt>
              <dd className="font-medium">{formatPrice(session.price)}</dd>
            </div>
            <div>
              <dt className="text-brand-navy/75">Spots</dt>
              <dd className="font-medium">
                {spotsLeft} of {session.capacity} left
              </dd>
            </div>
            <div>
              <dt className="text-brand-navy/75">Host</dt>
              <dd className="font-medium">
                {session.host?.id ? <Link to={`/profile/${session.host.id}`} title={profilePreview(session.host)} className="text-brand-navy hover:underline">{session.host.name}</Link> : session.host?.name}
              </dd>
            </div>
          </dl>

          <div>
            <p className="mb-1 text-sm text-brand-navy/75">Going</p>
            <p className="flex flex-wrap gap-x-2 text-sm">
              {session.participants.map((participant, index) => (
                <span key={participant.id}>
                  {index > 0 && <span aria-hidden="true">, </span>}
                  <Link to={`/profile/${participant.id}`} title={profilePreview(participant)} className="text-brand-navy hover:underline">{participant.name}</Link>
                </span>
              ))}
            </p>
          </div>

          {error && <p className="text-sm text-brand-orange">{error}</p>}

          {isHost ? (
            <p className="rounded-xl bg-brand-lime/25 py-3 text-center font-semibold text-brand-navy">You're hosting this session ✓</p>
          ) : hasJoined ? (
            <div className="space-y-2">
              <p className="rounded-xl bg-brand-lime/25 py-3 text-center font-semibold text-brand-navy">You're in! ✓</p>
              {!started && (
                <button
                  onClick={() => runAction(leaveSession)}
                  disabled={busy}
                  className="w-full text-sm text-brand-navy/75 hover:text-brand-orange hover:underline disabled:opacity-50"
                >
                  {busy ? 'Leaving…' : "Can't make it? Leave session"}
                </button>
              )}
            </div>
          ) : started ? (
            <p className="rounded-xl bg-brand-navy/5 py-3 text-center font-semibold text-brand-navy/75">This session has already started</p>
          ) : (
            <button
              onClick={() => runAction(joinSession)}
              disabled={busy || spotsLeft <= 0}
              className="w-full rounded-xl bg-brand-lime py-3 font-semibold text-brand-cream hover:bg-brand-lime/80 disabled:opacity-50"
            >
              {spotsLeft <= 0 ? 'Session full' : busy ? 'Joining…' : 'Join session'}
            </button>
          )}
        </div>

        {hasJoined && <Chat sessionId={session.id} user={user} />}
      </div>
    </div>
  )
}

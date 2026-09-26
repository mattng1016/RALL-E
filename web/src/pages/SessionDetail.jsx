import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCurrentUser, getMessages, getSession, joinSession, sendMessage, subscribeToChanges } from '../lib/api'
import { SPORT_EMOJI } from '../lib/constants'
import { capitalize, formatDateTime, formatPrice } from '../lib/format'

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
    <div className="rounded-xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 px-4 py-2 font-semibold">Session chat</h2>
      <div className="max-h-72 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet. Say hi!</p>}
        {messages.map((m) => (
          <p key={m.id} className="text-sm">
            <span className="font-semibold">{m.user?.name ?? 'Someone'}:</span> {m.text}
          </p>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="See you there!"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">Send</button>
      </form>
    </div>
  )
}

export default function SessionDetail() {
  const { id } = useParams()
  const user = getCurrentUser()
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

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
        { table: 'session_participants', filter: `session_id=eq.${id}` },
      ],
      load,
    )
  }, [load, id])

  async function handleJoin() {
    setJoining(true)
    setError(null)
    try {
      await joinSession(id, user.id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  if (error && !session) return <p className="p-6 text-red-600">{error}</p>
  if (!session) return <p className="p-6 text-slate-500">Loading…</p>

  const spotsLeft = session.capacity - session.participant_count
  const hasJoined = session.participants.some((p) => p.id === user.id)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {SPORT_EMOJI[session.sport]} {session.court.name}
              </h1>
              <p className="text-slate-500">{formatDateTime(session.start_time)} · {session.duration_min} min</p>
            </div>
            {session.is_coach && <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">Coach session</span>}
          </div>

          <p>{session.description}</p>

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Level</dt>
              <dd className="font-medium">{capitalize(session.level)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Price</dt>
              <dd className="font-medium">{formatPrice(session.price)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Spots</dt>
              <dd className="font-medium">
                {spotsLeft} of {session.capacity} left
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Host</dt>
              <dd className="font-medium">{session.host?.name}</dd>
            </div>
          </dl>

          <div>
            <p className="mb-1 text-sm text-slate-500">Going</p>
            <p className="text-sm">{session.participants.map((p) => p.name).join(', ')}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {hasJoined ? (
            <p className="rounded-xl bg-emerald-50 py-3 text-center font-semibold text-emerald-700">You're in! ✓</p>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining || spotsLeft <= 0}
              className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {spotsLeft <= 0 ? 'Session full' : joining ? 'Joining…' : 'Join session'}
            </button>
          )}
        </div>

        {hasJoined && <Chat sessionId={session.id} user={user} />}
      </div>
    </div>
  )
}

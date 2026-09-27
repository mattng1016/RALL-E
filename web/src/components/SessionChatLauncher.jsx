import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentUser, getMessages, getMySessions, sendMessage, subscribeToChanges } from '../lib/api'
import { SPORT_EMOJI } from '../lib/constants'

export default function SessionChatLauncher() {
  const user = getCurrentUser()
  const userId = user?.id
  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const selectedSessionId = selectedSession?.id
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const loadSessions = useCallback(() => {
    if (!userId) return Promise.resolve()
    return getMySessions(userId)
      .then(setSessions)
      .catch((err) => setError(err.message))
  }, [userId])

  useEffect(() => {
    loadSessions()
    return subscribeToChanges([{ table: 'sessions' }, { table: 'session_participants' }], loadSessions)
  }, [loadSessions])

  const loadMessages = useCallback(() => {
    if (!selectedSessionId) return Promise.resolve()
    return getMessages(selectedSessionId)
      .then(setMessages)
      .catch((err) => setError(err.message))
  }, [selectedSessionId])

  useEffect(() => {
    if (!selectedSessionId) return undefined
    loadMessages()
    return subscribeToChanges([{ table: 'messages', filter: `session_id=eq.${selectedSessionId}` }], loadMessages)
  }, [loadMessages, selectedSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(event) {
    event.preventDefault()
    const message = text.trim()
    if (!message || !selectedSession || sending) return
    setSending(true)
    setError('')
    try {
      await sendMessage(selectedSession.id, userId, message)
      setText('')
      await loadMessages()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-3">
      {open && (
        <section className="flex h-[min(32rem,calc(100dvh-6rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="Session chats">
          <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-3">
            {selectedSession && (
              <button
                type="button"
                onClick={() => { setSelectedSession(null); setMessages([]); setError('') }}
                aria-label="Back to session chats"
                className="rounded-lg px-2 py-1 text-lg leading-none text-slate-600 hover:bg-slate-100"
              >
                ←
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold text-slate-900">{selectedSession?.court?.name ?? 'Session chats'}</h2>
              <p className="text-xs text-slate-500">{selectedSession ? 'Chat with your session' : `${sessions.length} joined ${sessions.length === 1 ? 'session' : 'sessions'}`}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chats" className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100">×</button>
          </header>

          {error && <p role="alert" className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          {!selectedSession ? (
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {sessions.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">Join or host a session to start chatting.</p>
              ) : sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => { setSelectedSession(session); setError('') }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-lg">{SPORT_EMOJI[session.sport]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{session.court?.name ?? 'Sports session'}</span>
                    <span className="block truncate text-xs text-slate-500">{session.participant_count} {session.participant_count === 1 ? 'player' : 'players'} · {session.host?.name ?? 'Session chat'}</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-400">›</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
                {messages.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No messages yet. Say hi!</p>}
                {messages.map((message) => {
                  const mine = message.user_id === user.id
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? 'rounded-br-sm bg-slate-900 text-white' : 'rounded-bl-sm bg-white text-slate-900 shadow-sm'}`}>
                        {!mine && <p className="mb-0.5 text-xs font-semibold text-slate-500">{message.user?.name ?? 'Player'}</p>}
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={1000}
                  placeholder="Write a message…"
                  aria-label="Message"
                  className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-500"
                />
                <button type="submit" disabled={!text.trim() || sending} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {sending ? '…' : 'Send'}
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close session chats' : 'Open session chats'}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white shadow-xl transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        <span aria-hidden="true">▰</span> Chats {sessions.length > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{sessions.length}</span>}
      </button>
    </div>
  )
}

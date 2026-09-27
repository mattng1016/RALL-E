import { useCallback, useEffect, useRef, useState } from 'react'
import { getCurrentUser, getMessages, getMySessions, sendMessage, subscribeToChanges } from '../lib/api'
import { SPORT_EMOJI } from '../lib/constants'

function formatSessionStart(value) {
  const start = new Date(value)
  const now = new Date()
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysFromToday = Math.round((startDay - today) / 86_400_000)
  const dayLabel = daysFromToday === 0
    ? 'Today'
    : daysFromToday === 1
      ? 'Tomorrow'
      : daysFromToday === -1
        ? 'Yesterday'
        : start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  const timeLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `${dayLabel} · ${timeLabel}`
}

function isSameMessageBurst(first, second) {
  if (!first || !second || first.user_id !== second.user_id) return false
  const gap = new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
  return gap >= 0 && gap <= 2 * 60 * 1000
}

function SessionRow({ session, onOpen, onAction, actionLabel }) {
  return (
    <div className="flex items-center gap-1 rounded-xl pr-1 hover:bg-brand-cream">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-3 text-left focus-visible:outline-2 focus-visible:outline-brand-navy"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-lime text-lg">{SPORT_EMOJI[session.sport]}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-brand-navy">{session.court?.name ?? 'Sports session'}</span>
          <span className="block truncate text-xs font-medium text-brand-navy">{formatSessionStart(session.start_time)}</span>
          <span className="block truncate text-xs text-brand-navy/75">{session.participant_count} {session.participant_count === 1 ? 'player' : 'players'} · {session.host?.name ?? 'Session chat'}</span>
        </span>
        <span aria-hidden="true" className="text-brand-navy/75">›</span>
      </button>
      <button
        type="button"
        onClick={onAction}
        aria-label={`${actionLabel} ${session.court?.name ?? 'session chat'}`}
        title={actionLabel}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-brand-navy/75 hover:bg-brand-cream hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-navy"
      >
        {actionLabel === 'Archive' ? '×' : '↶'}
      </button>
    </div>
  )
}

export default function SessionChatLauncher() {
  const user = getCurrentUser()
  const userId = user?.id
  const archiveStorageKey = userId ? `ralle_archived_chats_${userId}` : null
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [sessions, setSessions] = useState([])
  const [archivedSessionIds, setArchivedSessionIds] = useState(() => {
    if (!archiveStorageKey) return []
    try {
      return JSON.parse(localStorage.getItem(archiveStorageKey) ?? '[]')
    } catch {
      return []
    }
  })
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

  useEffect(() => {
    if (archiveStorageKey) localStorage.setItem(archiveStorageKey, JSON.stringify(archivedSessionIds))
  }, [archiveStorageKey, archivedSessionIds])

  const activeSessions = sessions.filter((session) => !archivedSessionIds.includes(session.id))
  const archivedSessions = sessions.filter((session) => archivedSessionIds.includes(session.id))

  function archiveSession(sessionId) {
    setArchivedSessionIds((current) => [...new Set([...current, sessionId])])
  }

  function restoreSession(sessionId) {
    setArchivedSessionIds((current) => current.filter((id) => id !== sessionId))
  }

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
        <section className={`flex ${expanded ? 'h-[min(42rem,calc(100dvh-6rem))] w-[min(32rem,calc(100vw-2rem))]' : 'h-[min(32rem,calc(100dvh-6rem))] w-[min(22rem,calc(100vw-2rem))]'} flex-col overflow-hidden rounded-2xl border border-brand-navy/20 bg-brand-cream shadow-2xl transition-[width,height] duration-200`} aria-label="Session chats">
          <header className="flex items-center gap-2 border-b border-brand-navy/20 bg-brand-cream px-3 py-3">
            {selectedSession && (
              <button
                type="button"
                onClick={() => { setSelectedSession(null); setMessages([]); setError('') }}
                aria-label="Back to session chats"
                className="rounded-lg px-2 py-1 text-lg leading-none text-brand-navy/75 hover:bg-brand-navy/5"
              >
                ←
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold text-brand-navy">{selectedSession?.court?.name ?? 'Session chats'}</h2>
              <p className="text-xs text-brand-navy/75">{selectedSession ? 'Chat with your session' : `${activeSessions.length} open ${activeSessions.length === 1 ? 'chat' : 'chats'}`}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? 'Shrink chats panel' : 'Expand chats panel'}
              aria-pressed={expanded}
              title={expanded ? 'Shrink chats panel' : 'Expand chats panel'}
              className="rounded-lg px-2 py-1 text-base leading-none text-brand-navy/75 hover:bg-brand-navy/5"
            >
              {expanded ? '↙' : '↗'}
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chats" className="rounded-lg px-2 py-1 text-xl leading-none text-brand-navy/75 hover:bg-brand-navy/5">×</button>
          </header>

          {error && <p role="alert" className="border-b border-brand-orange bg-brand-orange/10 px-3 py-2 text-xs text-brand-navy">{error}</p>}

          {!selectedSession ? (
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {activeSessions.length === 0 ? (
                <p className="p-4 text-center text-sm text-brand-navy/75">{archivedSessions.length > 0 ? 'No open chats. Your archived chats are below.' : 'Join or host a session to start chatting.'}</p>
              ) : activeSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  onOpen={() => { setSelectedSession(session); setError('') }}
                  onAction={() => archiveSession(session.id)}
                  actionLabel="Archive"
                />
              ))}
              {archivedSessions.length > 0 && (
                <details className="mt-3 border-t border-brand-navy/20 pt-2">
                  <summary className="cursor-pointer px-2 py-2 text-xs font-semibold text-brand-navy/75 hover:text-brand-navy">Archived chats ({archivedSessions.length})</summary>
                  <div className="space-y-1 pt-1">
                    {archivedSessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        onOpen={() => { setSelectedSession(session); setError('') }}
                        onAction={() => restoreSession(session.id)}
                        actionLabel="Restore"
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto bg-brand-cream p-3">
                {messages.length === 0 && <p className="py-6 text-center text-sm text-brand-navy/75">No messages yet. Say hi!</p>}
                {messages.map((message, index) => {
                  const mine = message.user_id === user.id
                  const groupedWithPrevious = isSameMessageBurst(messages[index - 1], message)
                  const groupedWithNext = isSameMessageBurst(message, messages[index + 1])
                  const sentAt = new Date(message.created_at)
                  const timeLabel = sentAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  return (
                    <div key={message.id} style={{ marginTop: groupedWithPrevious ? 2 : undefined }} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%]">
                        <div className={`rounded-2xl px-3 py-2 text-sm ${mine ? `${groupedWithNext ? 'rounded-br-xl' : 'rounded-br-sm'} bg-brand-navy text-brand-cream` : `${groupedWithNext ? 'rounded-bl-xl' : 'rounded-bl-sm'} bg-brand-cream text-brand-navy shadow-sm`}`}>
                          {!mine && !groupedWithPrevious && <p className="mb-0.5 text-xs font-semibold text-brand-navy/75">{message.user?.name ?? 'Player'}</p>}
                          <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        </div>
                        {!groupedWithNext && (
                          <time dateTime={message.created_at} title={sentAt.toLocaleString()} className={`mt-1 block text-[10px] text-brand-navy/75 ${mine ? 'text-right' : 'text-left'}`}>
                            {timeLabel}
                          </time>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 border-t border-brand-navy/20 p-3">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={1000}
                  placeholder="Write a message…"
                  aria-label="Message"
                  className="min-w-0 flex-1 rounded-full border border-brand-navy/20 px-4 py-2 text-sm outline-none focus:border-brand-navy/20"
                />
                <button type="submit" disabled={!text.trim() || sending} className="rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50">
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
        className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-3 font-semibold text-brand-cream shadow-xl transition hover:bg-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
      >
        <span aria-hidden="true">▰</span> Chats {activeSessions.length > 0 && <span className="rounded-full bg-brand-cream/20 px-2 py-0.5 text-xs">{activeSessions.length}</span>}
      </button>
    </div>
  )
}

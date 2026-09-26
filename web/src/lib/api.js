import { supabase } from './supabase'
import * as mock from '../data/mock'

const USER_KEY = 'ralle_user'

const SESSION_LIST_SELECT =
  '*, court:courts(*), host:users!sessions_host_id_fkey(*), participants:session_participants(count)'
const SESSION_DETAIL_SELECT =
  '*, court:courts(*), host:users!sessions_host_id_fkey(*), participants:session_participants(user:users(*))'

export const usingMockData = !supabase

// ---------- Users ----------

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function saveUser({ name, sport, level }) {
  const user = { id: getCurrentUser()?.id ?? crypto.randomUUID(), name, sport, level }

  if (supabase) {
    const { error } = await supabase.from('users').upsert(user)
    if (error) throw error
  } else {
    mock.users.splice(0, mock.users.length, ...mock.users.filter((u) => u.id !== user.id), user)
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

// The saved user can be missing from the database (onboarded in mock mode, or the DB was reset),
// which makes joins and messages fail on the users foreign key.
export async function syncCurrentUser() {
  const user = getCurrentUser()
  if (!supabase || !user) return
  const { error } = await supabase.from('users').upsert(user)
  if (error) console.error('Failed to sync user', error)
}

// ---------- Courts ----------

export async function getCourts(sport) {
  if (supabase) {
    let query = supabase.from('courts').select('*').order('name')
    if (sport) query = query.eq('sport', sport)
    const { data, error } = await query
    if (error) throw error
    return data
  }

  return mock.courts.filter((c) => !sport || c.sport === sport)
}

// ---------- Sessions ----------

function mockExpandSession(session) {
  const participants = mock.sessionParticipants
    .filter((p) => p.session_id === session.id)
    .map((p) => mock.users.find((u) => u.id === p.user_id))
    .filter(Boolean)

  return {
    ...session,
    court: mock.courts.find((c) => c.id === session.court_id),
    host: mock.users.find((u) => u.id === session.host_id),
    participants,
    participant_count: participants.length,
  }
}

export async function getSessions({ sport, level } = {}) {
  const now = new Date().toISOString()

  if (supabase) {
    let query = supabase.from('sessions').select(SESSION_LIST_SELECT).gte('start_time', now).order('start_time')
    if (sport) query = query.eq('sport', sport)
    if (level) query = query.eq('level', level)
    const { data, error } = await query
    if (error) throw error
    return data.map((s) => ({ ...s, participant_count: s.participants?.[0]?.count ?? 0 }))
  }

  return mock.sessions
    .filter((s) => s.start_time >= now)
    .filter((s) => !sport || s.sport === sport)
    .filter((s) => !level || s.level === level)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map(mockExpandSession)
}

export async function getSession(id) {
  if (supabase) {
    const { data, error } = await supabase.from('sessions').select(SESSION_DETAIL_SELECT).eq('id', id).single()
    if (error) throw error
    const participants = data.participants.map((p) => p.user)
    return { ...data, participants, participant_count: participants.length }
  }

  const session = mock.sessions.find((s) => s.id === id)
  return session ? mockExpandSession(session) : null
}

export async function createSession(fields, hostId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ ...fields, host_id: hostId })
      .select('id')
      .single()
    if (error) throw error
    await joinSession(data.id, hostId)
    return data.id
  }

  const id = `s${Date.now()}`
  mock.sessions.push({ ...fields, id, host_id: hostId })
  mock.sessionParticipants.push({ session_id: id, user_id: hostId })
  return id
}

export async function joinSession(sessionId, userId) {
  if (supabase) {
    const { error } = await supabase.rpc('join_session', { p_session_id: sessionId, p_user_id: userId })
    if (error) throw error
    return
  }

  const session = mock.sessions.find((s) => s.id === sessionId)
  const joined = mock.sessionParticipants.filter((p) => p.session_id === sessionId)
  if (joined.some((p) => p.user_id === userId)) return
  if (joined.length >= session.capacity) throw new Error('Session is full')
  mock.sessionParticipants.push({ session_id: sessionId, user_id: userId })
}

// ---------- Realtime ----------

// Calls onChange whenever a row changes in any of the given tables; returns an unsubscribe function.
// Tables must be in the supabase_realtime publication (see supabase/schema.sql).
export function subscribeToChanges(listeners, onChange) {
  if (!supabase) return () => {}

  const channel = supabase.channel(`changes-${crypto.randomUUID()}`)
  for (const { table, filter } of listeners) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, ...(filter && { filter }) }, onChange)
  }
  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ---------- Chat ----------

export async function getMessages(sessionId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, user:users(name)')
      .eq('session_id', sessionId)
      .order('created_at')
    if (error) throw error
    return data
  }

  return mock.messages
    .filter((m) => m.session_id === sessionId)
    .map((m) => ({ ...m, user: mock.users.find((u) => u.id === m.user_id) }))
}

export async function sendMessage(sessionId, userId, text) {
  if (supabase) {
    const { error } = await supabase.from('messages').insert({ session_id: sessionId, user_id: userId, text })
    if (error) throw error
    return
  }

  mock.messages.push({
    id: `m${Date.now()}`,
    session_id: sessionId,
    user_id: userId,
    text,
    created_at: new Date().toISOString(),
  })
}

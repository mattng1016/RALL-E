import { supabase } from './supabase'
import * as mock from '../data/mock'
import { durationError, startTimeError } from './sessionTime'

const USER_KEY = 'ralle_user'

const SESSION_LIST_SELECT =
  '*, court:courts(*), host:users!sessions_host_id_fkey(*), participants:session_participants(count)'
const SESSION_DETAIL_SELECT =
  '*, court:courts(*), host:users!sessions_host_id_fkey(*), participants:session_participants(user:users(*))'

export const usingMockData = !supabase

// ---------- Users ----------

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY)
  const user = raw ? JSON.parse(raw) : null
  // Mock tables reset on reload, but the onboarding profile survives in storage.
  // Restore it so joins, hosted sessions, and messages can resolve the player.
  if (!supabase && user) {
    const index = mock.users.findIndex((entry) => entry.id === user.id)
    if (index === -1) mock.users.push(user)
    else mock.users[index] = user
  }
  return user
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY)
}

// Loads the profile row of a signed-in account and caches it, so getCurrentUser() stays synchronous.
export async function loadProfile(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (data) localStorage.setItem(USER_KEY, JSON.stringify(data))
  else clearCurrentUser()
  return data
}

export async function getUserProfile(userId) {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    if (!data) return null
    const [detailsResult, sportsResult] = await Promise.all([
      supabase.rpc('get_public_profile_details', { target_user_id: userId }),
      supabase.from('user_sports').select('sport,skill_level,position').eq('user_id', userId).order('position'),
    ])
    if (detailsResult.error) throw detailsResult.error
    if (sportsResult.error) throw sportsResult.error
    const sports = sportsResult.data.length
      ? sportsResult.data
      : [{ sport: data.sport, skill_level: data.level === 'beginner' ? 'Just starting' : data.level === 'intermediate' ? 'Intermediate' : 'Advanced' }]
    return { ...data, ...(detailsResult.data ?? {}), sports }
  }

  const user = mock.users.find((profile) => profile.id === userId)
  if (!user) return null
  const publicFields = { id: user.id, name: user.name, sport: user.sport, level: user.level, bio: user.bio, created_at: user.created_at }
  const sports = user.sports ?? [{ sport: user.sport, skill_level: user.level === 'beginner' ? 'Just starting' : user.level === 'intermediate' ? 'Intermediate' : 'Advanced' }]
  return {
    ...publicFields,
    sports,
    sex: user.sex_public ? user.sex : null,
    age: user.age_public ? user.age : null,
    is_coach: user.coach_public ? Boolean(user.is_coach) : null,
    coach_certificate_path: undefined,
  }
}

const EMPTY_PROFILE_DETAILS = {
  sex: '', age: null, sex_public: false, age_public: false,
  is_coach: false, coach_public: false, coach_certificate_path: null,
}

export async function getOwnProfileDetails(userId) {
  if (supabase) {
    const { data, error } = await supabase.from('user_profile_private').select('*').eq('user_id', userId).maybeSingle()
    if (error) throw error
    return { ...EMPTY_PROFILE_DETAILS, ...(data ?? {}) }
  }

  const user = mock.users.find((profile) => profile.id === userId)
  let saved = {}
  try {
    saved = JSON.parse(localStorage.getItem(`ralle_private_profile_${userId}`) ?? '{}')
  } catch {
    // Ignore malformed local profile details and use defaults.
  }
  return { ...EMPTY_PROFILE_DETAILS, ...(user ?? {}), ...saved }
}

export async function getOwnProfileSports(userId) {
  if (supabase) {
    const { data, error } = await supabase.from('user_sports').select('sport,skill_level,position').eq('user_id', userId).order('position')
    if (error) throw error
    if (data.length) return data
    const { data: user, error: profileError } = await supabase.from('users').select('sport,level').eq('id', userId).single()
    if (profileError) throw profileError
    return [{ sport: user.sport, skill_level: user.level === 'beginner' ? 'Just starting' : user.level === 'intermediate' ? 'Intermediate' : 'Advanced' }]
  }

  const stored = localStorage.getItem(`ralle_profile_sports_${userId}`)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Recover from malformed local preferences with the saved primary sport.
    }
  }
  const user = mock.users.find((profile) => profile.id === userId)
  return user?.sports ?? (user ? [{ sport: user.sport, skill_level: user.level === 'beginner' ? 'Just starting' : user.level === 'intermediate' ? 'Intermediate' : 'Advanced' }] : [])
}

export async function saveOwnProfileSports(userId, sports) {
  if (!sports.length) throw new Error('Choose at least one sport.')
  if (supabase) {
    const { error } = await supabase.rpc('save_user_sports', { sports_data: sports })
    if (error) throw error
    return sports
  }

  const user = mock.users.find((profile) => profile.id === userId)
  if (user) user.sports = sports
  localStorage.setItem(`ralle_profile_sports_${userId}`, JSON.stringify(sports))
  return sports
}

export async function saveOwnProfileDetails(userId, details) {
  const row = { user_id: userId, ...details }
  if (supabase) {
    const { error } = await supabase.from('user_profile_private').upsert(row)
    if (error) throw error
    return row
  }

  const user = mock.users.find((profile) => profile.id === userId)
  if (user) Object.assign(user, details)
  localStorage.setItem(`ralle_private_profile_${userId}`, JSON.stringify(details))
  return row
}

export async function uploadCoachCertificate(userId, file) {
  if (!supabase) return `mock/${userId}/${file.name}`
  const extension = file.name.split('.').pop()?.toLowerCase() || 'file'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('coach-certificates').upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

// Pass the auth user's id when signed in; mock mode generates one.
export async function saveUser({ id, name, sport, level, bio = '' }) {
  const previous = getCurrentUser()
  const user = { ...previous, id: id ?? previous?.id ?? crypto.randomUUID(), name, sport, level, bio: bio.trim() }

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

// Every session the user is in (hosted or joined), past and upcoming, soonest first.
export async function getMySessions(userId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`${SESSION_LIST_SELECT}, me:session_participants!inner(user_id)`)
      .eq('me.user_id', userId)
      .order('start_time')
    if (error) throw error
    return data.map((s) => ({ ...s, participant_count: s.participants?.[0]?.count ?? 0 }))
  }

  const mySessionIds = new Set(
    mock.sessionParticipants.filter((p) => p.user_id === userId).map((p) => p.session_id),
  )
  return mock.sessions
    .filter((s) => mySessionIds.has(s.id))
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
  const start = new Date(fields.start_time)
  const timeError = startTimeError(start) || durationError(fields.duration_min, start)
  if (timeError) throw new Error(timeError)

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
  if (new Date(session.start_time) <= new Date()) throw new Error('This session has already started')
  if (joined.length >= session.capacity) throw new Error('Session is full')
  mock.sessionParticipants.push({ session_id: sessionId, user_id: userId })
}

export async function leaveSession(sessionId, userId) {
  if (supabase) {
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId)
    if (error) throw error
    return
  }

  const index = mock.sessionParticipants.findIndex((p) => p.session_id === sessionId && p.user_id === userId)
  if (index !== -1) mock.sessionParticipants.splice(index, 1)
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
      .select('*, user:users(*)')
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

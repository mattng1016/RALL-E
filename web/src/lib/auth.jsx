/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearCurrentUser, getCurrentUser, loadProfile } from './api'
import { supabase } from './supabase'

const AuthContext = createContext(null)

// Without Supabase (mock mode) there is no login: the onboarding profile in localStorage is the user.
export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(Boolean(supabase))
  const [profileState, setProfileState] = useState({ userId: null, profile: null })

  useEffect(() => {
    if (!supabase) return undefined

    function handleSession(session) {
      if (!session) clearCurrentUser()
      setAuthUser(session?.user ?? null)
      setSessionLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const userId = authUser?.id

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    loadProfile(userId)
      .catch(() => null)
      .then((profile) => {
        if (!cancelled) setProfileState({ userId, profile })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return null
    const profile = await loadProfile(userId)
    setProfileState({ userId, profile })
    return profile
  }, [userId])

  const profileLoading = Boolean(userId) && profileState.userId !== userId
  const profile = userId && profileState.userId === userId ? profileState.profile : null

  const value = useMemo(
    () =>
      supabase
        ? { authEnabled: true, authUser, profile, loading: sessionLoading || profileLoading, refreshProfile }
        : { authEnabled: false, authUser: null, profile: getCurrentUser(), loading: false, refreshProfile },
    [authUser, profile, sessionLoading, profileLoading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export async function signIn(email, password) {
  ensureConfigured()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp({ name, email, password }) {
  ensureConfigured()
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
  if (error) throw error
  return data.session
}

export async function signOut() {
  ensureConfigured()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  clearCurrentUser()
}

function ensureConfigured() {
  if (!supabase) throw new Error('Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to web/.env.')
}

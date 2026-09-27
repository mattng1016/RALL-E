import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const usesExampleValue = url?.includes('your-project-ref') || anonKey === 'your-supabase-anon-key'

export const isSupabaseConfigured = Boolean(url && anonKey && !usesExampleValue)
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

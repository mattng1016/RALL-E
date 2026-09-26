import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null means "no .env yet" and the app falls back to mock data.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

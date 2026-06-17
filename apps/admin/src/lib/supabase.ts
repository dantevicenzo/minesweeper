import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url && typeof window === 'undefined') return 'http://localhost:54321'
  return url ?? ''
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key && typeof window === 'undefined') return 'placeholder'
  return key ?? ''
}

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())

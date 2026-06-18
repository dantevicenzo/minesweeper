import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

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

function ensureClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return _supabase
}

export function getSupabase(): SupabaseClient {
  return ensureClient()
}

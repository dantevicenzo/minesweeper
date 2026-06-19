import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl) {
  throw new Error(
    'supabaseUrl is required. Configure NEXT_PUBLIC_SUPABASE_URL no seu .env.local'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'supabaseAnonKey is required. Configure NEXT_PUBLIC_SUPABASE_ANON_KEY no seu .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
  },
})

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? ''

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return createClient(
      supabaseUrl || 'http://localhost:54321',
      supabaseServiceKey || 'placeholder-key'
    )
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export const supabase = createSupabaseClient()

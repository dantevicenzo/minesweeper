import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { env } from '../env'

if (!env.SUPABASE_URL) throw new Error('SUPABASE_URL is required')
if (!env.SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required')

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
})

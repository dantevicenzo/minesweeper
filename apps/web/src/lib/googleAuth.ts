import { supabase } from './supabase'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

export async function signInWithGoogle(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is required')
  }

  try {
    await loadGIS()
  } catch {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: '/auth/callback' },
    })
    return
  }

  const google = (globalThis as any).google

  return new Promise((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
      callback: async (response: { credential: string }) => {
        try {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
          })
          if (error) throw error
          resolve()
        } catch (err) {
          reject(err)
        }
      },
    })

    google.accounts.id.prompt()
  })
}

async function loadGIS(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Not in browser')
  }
  if ((globalThis as any).google?.accounts?.id) {
    return
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load GIS'))
    document.head.appendChild(script)
  })
}

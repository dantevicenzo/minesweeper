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
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not available')
  }

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid profile email',
      callback: async (response: { error?: string; id_token?: string }) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        if (!response.id_token) {
          reject(new Error('No ID token received'))
          return
        }
        try {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.id_token,
          })
          if (error) throw error
          resolve()
        } catch (err) {
          reject(err)
        }
      },
    })

    client.requestAccessToken()
  })
}

async function loadGIS(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Not in browser')
  }
  if ((globalThis as any).google?.accounts?.oauth2) {
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

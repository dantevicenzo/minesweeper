import { supabase } from './supabase'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

function decodeJWTPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  return JSON.parse(atob(parts[1]))
}

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
  if (!google?.accounts?.id) {
    throw new Error('Google Identity Services not available')
  }

  return new Promise((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
      callback: async (response: { credential: string }) => {
        try {
          const payload = decodeJWTPayload(response.credential)
          const nonce = payload.nonce as string | undefined

          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            ...(nonce ? { nonce } : {}),
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

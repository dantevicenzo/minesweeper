import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '../supabase'

const mocks = vi.hoisted(() => ({
  signInWithIdToken: vi.fn(),
  signInWithOAuth: vi.fn(),
}))

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: mocks.signInWithIdToken,
      signInWithOAuth: mocks.signInWithOAuth,
    },
  },
}))

const VALID_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'

describe('signInWithGoogle', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', VALID_CLIENT_ID)
    vi.restoreAllMocks()
    vi.resetModules()
    delete (globalThis as any).google
    mocks.signInWithIdToken.mockResolvedValue({ error: null })
    mocks.signInWithOAuth.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('when GIS loads successfully', () => {
    it('requests an ID token via OAuth popup and exchanges it via signInWithIdToken', async () => {
      const mockRequestAccessToken = vi.fn()
      let capturedCallback:
        | ((response: { id_token?: string; error?: string }) => void)
        | null = null

      const mockInitTokenClient = vi.fn(
        (config: {
          client_id: string
          scope: string
          callback: (response: { id_token?: string; error?: string }) => void
        }) => {
          capturedCallback = config.callback
          return { requestAccessToken: mockRequestAccessToken }
        },
      )

      ;(globalThis as any).google = {
        accounts: {
          oauth2: {
            initTokenClient: mockInitTokenClient,
          },
        },
      }

      const { signInWithGoogle } = await import('../googleAuth')
      const promise = signInWithGoogle()

      await new Promise<void>((resolve) => setTimeout(resolve, 0))

      expect(mockInitTokenClient).toHaveBeenCalledWith({
        client_id: VALID_CLIENT_ID,
        scope: 'openid profile email',
        callback: expect.any(Function),
      })

      expect(mockRequestAccessToken).toHaveBeenCalledTimes(1)

      capturedCallback!({ id_token: 'test-id-token' })

      await promise

      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'test-id-token',
      })
    })
  })

  describe('when GIS fails to load', () => {
    it('falls back to OAuth redirect', async () => {
      let triggerOnError: (() => void) | null = null

      const script = document.createElement('script')
      vi.spyOn(document, 'createElement').mockReturnValue(script)
      vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
        if (el === script) {
          triggerOnError = () => script.onerror!(new Event('error'))
        }
        return el
      })

      const { signInWithGoogle } = await import('../googleAuth')
      const promise = signInWithGoogle()

      await new Promise<void>((resolve) => setTimeout(resolve, 0))

      triggerOnError!()

      await new Promise<void>((resolve) => setTimeout(resolve, 0))

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: '/auth/callback' },
      })

      await promise
    })
  })

  describe('when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set', () => {
    it('throws an error', async () => {
      vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '')

      const { signInWithGoogle } = await import('../googleAuth')
      await expect(signInWithGoogle()).rejects.toThrow(
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID is required',
      )
    })
  })
})

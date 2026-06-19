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
    it('calls initialize and prompt, then exchanges the token via signInWithIdToken', async () => {
      let capturedCallback:
        | ((response: { credential: string }) => void)
        | null = null

      const mockInitialize = vi.fn(
        (config: {
          client_id: string
          auto_select: boolean
          callback: (response: { credential: string }) => void
        }) => {
          capturedCallback = config.callback
        },
      )
      const mockPrompt = vi.fn()

      ;(globalThis as any).google = {
        accounts: {
          id: {
            initialize: mockInitialize,
            prompt: mockPrompt,
          },
        },
      }

      const { signInWithGoogle } = await import('../googleAuth')
      const promise = signInWithGoogle()

      // Flush microtasks so loadGIS resolves and initialize/prompt execute
      await new Promise<void>((resolve) => setTimeout(resolve, 0))

      expect(mockInitialize).toHaveBeenCalledWith({
        client_id: VALID_CLIENT_ID,
        auto_select: false,
        callback: expect.any(Function),
      })
      expect(mockPrompt).toHaveBeenCalled()

      capturedCallback!({ credential: 'test-id-token' })

      await promise

      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'test-id-token',
      })
    })
  })

  describe('when GIS fails to load', () => {
    it('falls back to OAuth redirect', async () => {
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('Failed to create script element')
      })

      const { signInWithGoogle } = await import('../googleAuth')
      await signInWithGoogle()

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: '/auth/callback' },
      })
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

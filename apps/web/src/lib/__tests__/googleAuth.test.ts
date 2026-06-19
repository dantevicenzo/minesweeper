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

function makeIDToken(nonce?: string): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ nonce }))
  return `${header}.${payload}.signature`
}

describe('when GIS loads successfully', () => {
  it('extracts nonce from token and passes it to signInWithIdToken', async () => {
    let capturedCallback: ((response: { credential: string }) => void) | null = null

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

    await new Promise<void>((resolve) => setTimeout(resolve, 0))

    expect(mockInitialize).toHaveBeenCalledWith({
      client_id: VALID_CLIENT_ID,
      auto_select: false,
      callback: expect.any(Function),
    })

    expect(mockPrompt).toHaveBeenCalled()

    capturedCallback!({ credential: makeIDToken('test-nonce') })

    await promise

    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: makeIDToken('test-nonce'),
      nonce: 'test-nonce',
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  profilesMe: vi.fn(),
  push: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      signInWithOAuth: mocks.signInWithOAuth,
      signOut: mocks.signOut,
    },
  },
}))

vi.mock('../../lib/api', () => ({
  api: {
    profiles: { me: mocks.profilesMe },
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

import { AuthProvider } from '../AuthContext'

function renderWithProvider(ui: ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  mocks.push.mockReset()
})

afterEach(cleanup)

describe('AuthProvider username gate', () => {
  it('does not redirect when user is null (no session)', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } })
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 0))
    expect(mocks.profilesMe).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalledWith('/setup-username')
  })

  it('redirects to /setup-username when profile.username is null', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' }, access_token: 'tok' } },
    })
    mocks.profilesMe.mockResolvedValue({ profile: { username: null, full_name: null } })
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 10))
    expect(mocks.profilesMe).toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledWith('/setup-username')
  })

  it('does not redirect when profile.username is set', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' }, access_token: 'tok' } },
    })
    mocks.profilesMe.mockResolvedValue({ profile: { username: 'alice', full_name: 'Alice' } })
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 10))
    expect(mocks.profilesMe).toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalledWith('/setup-username')
  })

  it('does not throw or redirect when api.profiles.me rejects (network error)', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' }, access_token: 'tok' } },
    })
    mocks.profilesMe.mockRejectedValue(new Error('network'))
    renderWithProvider(<div>child</div>)
    await new Promise(r => setTimeout(r, 10))
    expect(mocks.push).not.toHaveBeenCalledWith('/setup-username')
  })
})

import { render, screen, act, fireEvent } from '@testing-library/react-native'
import { Text, Button } from 'react-native'
import { AuthProvider, useAuth } from '../AuthContext'

jest.mock('../../lib/supabase', () => {
  const auth = {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signInWithOAuth: jest.fn(),
    signInWithIdToken: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  }
  return { supabase: { auth } }
})

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    hasPreviousSignIn: jest.fn(),
    restorePreviousSignIn: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}))

function TestComponent() {
  const { user, session, loading, signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle, signOut } = useAuth()
  if (loading) return <Text testID="loading">loading</Text>
  return (
    <>
      <Text testID="user">{user ? user.email : 'null'}</Text>
      <Text testID="session">{session ? 'active' : 'null'}</Text>
      <Button title="signIn" onPress={() => signInWithEmail('a@b.com', 'pw')} />
      <Button title="signUp" onPress={() => signUpWithEmail('a@b.com', 'pw')} />
      <Button title="apple" onPress={() => signInWithApple()} />
      <Button title="google" onPress={() => signInWithGoogle()} />
      <Button title="signOut" onPress={() => signOut()} />
    </>
  )
}

function getMockAuth() {
  const mod = jest.requireMock('../../lib/supabase')
  return mod.supabase.auth as jest.Mocked<typeof mod.supabase.auth>
}

function getMockGoogleSignin() {
  const mod = jest.requireMock('@react-native-google-signin/google-signin')
  return mod.GoogleSignin as jest.Mocked<typeof mod.GoogleSignin>
}

beforeEach(() => {
  jest.clearAllMocks()
  const auth = getMockAuth()
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
})

describe('AuthContext', () => {
  it('shows loading then null user when not authenticated', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    expect(screen.getByTestId('loading')).toBeTruthy()
    expect(getMockAuth().getSession).toHaveBeenCalledTimes(1)
    await act(async () => {})
    expect(screen.getByTestId('user').children[0]).toBe('null')
    expect(screen.getByTestId('session').children[0]).toBe('null')
  })

  it('sets user and session from stored session', async () => {
    const fakeUser = { id: '1', email: 'a@b.com' }
    const fakeSession = { user: fakeUser }
    getMockAuth().getSession.mockResolvedValue({ data: { session: fakeSession }, error: null })
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await act(async () => {})
    expect(screen.getByTestId('user').children[0]).toBe('a@b.com')
    expect(screen.getByTestId('session').children[0]).toBe('active')
  })

  it('calls signInWithPassword on signInWithEmail', async () => {
    getMockAuth().signInWithPassword.mockResolvedValue({ data: {}, error: null })
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await act(async () => {})
    await act(async () => { fireEvent.press(screen.getByText('signIn')) })
    expect(getMockAuth().signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
  })

  it('calls signUp on signUpWithEmail', async () => {
    getMockAuth().signUp.mockResolvedValue({ data: {}, error: null })
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await act(async () => {})
    await act(async () => { fireEvent.press(screen.getByText('signUp')) })
    expect(getMockAuth().signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
  })

  it('calls signInWithOAuth with provider apple on signInWithApple', async () => {
    getMockAuth().signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await act(async () => {})
    await act(async () => { fireEvent.press(screen.getByText('apple')) })
    expect(getMockAuth().signInWithOAuth).toHaveBeenCalledWith({ provider: 'apple' })
  })

  it('calls GoogleSignin and exchanges token with Supabase', async () => {
    const auth = getMockAuth()
    auth.signInWithIdToken.mockResolvedValue({ data: {}, error: null })
    const google = getMockGoogleSignin()
    google.hasPreviousSignIn.mockReturnValue(false)
    google.signIn.mockResolvedValue({ idToken: 'google-token', user: { email: 'g@b.com' } })
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await act(async () => {})
    await act(async () => { fireEvent.press(screen.getByText('google')) })
    expect(getMockGoogleSignin().configure).toHaveBeenCalled()
    expect(getMockGoogleSignin().signIn).toHaveBeenCalled()
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'google-token' })
  })

  it('calls signOut on signOut', async () => {
    getMockAuth().signOut.mockResolvedValue({ error: null })
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await act(async () => {})
    await act(async () => { fireEvent.press(screen.getByText('signOut')) })
    expect(getMockAuth().signOut).toHaveBeenCalled()
  })
})

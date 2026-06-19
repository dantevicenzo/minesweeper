import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { AuthScreen } from '../screens/AuthScreen'
import { ThemeProvider } from '../contexts/ThemeContext'
import { I18nProvider } from '../contexts/I18nContext'

const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignInWithGoogle = jest.fn()
const mockSignInWithApple = jest.fn()

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signInWithEmail: mockSignIn,
    signUpWithEmail: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
  }),
}))

const mockGoBack = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AuthScreen', () => {
  it('renders sign in form by default', () => {
    const { getAllByText, getByPlaceholderText } = renderWithProviders(<AuthScreen />)
    expect(getAllByText('Sign In').length).toBeGreaterThanOrEqual(1)
    expect(getByPlaceholderText('Email')).toBeTruthy()
    expect(getByPlaceholderText('Password')).toBeTruthy()
  })

  it('toggles to sign up mode', () => {
    const { getAllByText } = renderWithProviders(<AuthScreen />)
    fireEvent.press(getAllByText("Don't have an account?")[0])
    expect(getAllByText('Sign Up').length).toBeGreaterThanOrEqual(1)
  })

  it('renders OAuth buttons', () => {
    const { getByText } = renderWithProviders(<AuthScreen />)
    expect(getByText('Continue with Google')).toBeTruthy()
    expect(getByText('Continue with GitHub')).toBeTruthy()
    expect(getByText('Continue with Apple')).toBeTruthy()
  })

  it('calls signInWithEmail on submit', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const { getByTestId, getByPlaceholderText } = renderWithProviders(<AuthScreen />)
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
    fireEvent.changeText(getByPlaceholderText('Password'), 'pass')
    await act(async () => {
      fireEvent.press(getByTestId('submit-btn'))
    })
    expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'pass')
  })

  it('navigates back on successful sign in', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const { getByTestId, getByPlaceholderText } = renderWithProviders(<AuthScreen />)
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
    fireEvent.changeText(getByPlaceholderText('Password'), 'correct')
    await act(async () => {
      fireEvent.press(getByTestId('submit-btn'))
    })
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('calls signUp on submit in sign up mode', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const { getByTestId, getAllByText, getByPlaceholderText } = renderWithProviders(<AuthScreen />)
    fireEvent.press(getAllByText("Don't have an account?")[0])
    fireEvent.changeText(getByPlaceholderText('Email'), 'new@test.com')
    fireEvent.changeText(getByPlaceholderText('Password'), 'password')
    await act(async () => {
      fireEvent.press(getByTestId('submit-btn'))
    })
    expect(mockSignUp).toHaveBeenCalledWith('new@test.com', 'password')
  })

  it('calls signInWithGoogle on Google button press', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined)
    const { getByText } = renderWithProviders(<AuthScreen />)
    fireEvent.press(getByText('Continue with Google'))
    expect(mockSignInWithGoogle).toHaveBeenCalled()
  })
})

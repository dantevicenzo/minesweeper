import { render } from '@testing-library/react-native'
import { SetupUsernameScreen } from '../screens/SetupUsernameScreen'
import { ThemeProvider } from '../contexts/ThemeContext'
import { I18nProvider } from '../contexts/I18nContext'
import { api } from '../lib/api'

jest.mock('../lib/api', () => ({
  api: {
    profiles: {
      usernameAvailable: jest.fn(),
      updateMe: jest.fn(),
    },
  },
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
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

describe('SetupUsernameScreen', () => {
  it('renders username and full name inputs', () => {
    const { getByPlaceholderText } = renderWithProviders(<SetupUsernameScreen />)
    expect(getByPlaceholderText('Username')).toBeTruthy()
    expect(getByPlaceholderText('Full Name')).toBeTruthy()
  })

  it('renders submit button', () => {
    const { getByText } = renderWithProviders(<SetupUsernameScreen />)
    expect(getByText('Save')).toBeTruthy()
  })

  it('renders title', () => {
    const { getByText } = renderWithProviders(<SetupUsernameScreen />)
    expect(getByText('Choose your username')).toBeTruthy()
  })
})

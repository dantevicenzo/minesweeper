import { render, fireEvent } from '@testing-library/react-native'
import { GameMenu } from '../GameMenu'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { I18nProvider } from '../../contexts/I18nContext'

const mockAuth: { user: { id: string; email: string } | null; signOut: jest.Mock } = {
  user: null,
  signOut: jest.fn(),
}

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  )
}

const baseProps = {
  onClose: () => {},
  onStartGame: () => {},
  onNewGame: () => {},
}

describe('GameMenu', () => {
  it('renders difficulty buttons', () => {
    const { getByText } = renderWithProviders(<GameMenu {...baseProps} />)
    expect(getByText('Easy')).toBeTruthy()
    expect(getByText('Medium')).toBeTruthy()
    expect(getByText('Hard')).toBeTruthy()
    expect(getByText('Custom')).toBeTruthy()
  })

  it('renders language and theme options', () => {
    const { getByText } = renderWithProviders(<GameMenu {...baseProps} />)
    expect(getByText('English')).toBeTruthy()
    expect(getByText('Light')).toBeTruthy()
  })

  it('shows custom inputs when Custom is selected', () => {
    const { getByText } = renderWithProviders(<GameMenu {...baseProps} />)
    fireEvent.press(getByText('Custom'))
    expect(getByText('▶')).toBeTruthy()
  })

  it('calls onStartGame with correct params when difficulty pressed', () => {
    const onStartGame = jest.fn()
    const onClose = jest.fn()
    const { getByText } = renderWithProviders(
      <GameMenu {...baseProps} onStartGame={onStartGame} onClose={onClose} />
    )
    fireEvent.press(getByText('Easy'))
    expect(onStartGame).toHaveBeenCalledWith('easy', 9, 9, 10)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onStartGame with medium params', () => {
    const onStartGame = jest.fn()
    const onClose = jest.fn()
    const { getByText } = renderWithProviders(
      <GameMenu {...baseProps} onStartGame={onStartGame} onClose={onClose} />
    )
    fireEvent.press(getByText('Medium'))
    expect(onStartGame).toHaveBeenCalledWith('medium', 16, 16, 40)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onStartGame with hard params', () => {
    const onStartGame = jest.fn()
    const onClose = jest.fn()
    const { getByText } = renderWithProviders(
      <GameMenu {...baseProps} onStartGame={onStartGame} onClose={onClose} />
    )
    fireEvent.press(getByText('Hard'))
    expect(onStartGame).toHaveBeenCalledWith('hard', 30, 16, 99)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onNewGame when new game button pressed', () => {
    const onNewGame = jest.fn()
    const onClose = jest.fn()
    const { getByText } = renderWithProviders(
      <GameMenu {...baseProps} onNewGame={onNewGame} onClose={onClose} />
    )
    fireEvent.press(getByText('New Game'))
    expect(onNewGame).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('shows sign out button when user is logged in', () => {
    mockAuth.user = { id: '1', email: 'test@test.com' }
    const { getByText } = renderWithProviders(<GameMenu {...baseProps} />)
    expect(getByText('Sign Out')).toBeTruthy()
  })
})

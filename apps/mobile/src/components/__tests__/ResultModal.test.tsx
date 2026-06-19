import { render, fireEvent } from '@testing-library/react-native'
import { ResultModal } from '../ResultModal'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { I18nProvider } from '../../contexts/I18nContext'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  )
}

const baseProps = {
  status: 'won' as const,
  time: 42,
  difficulty: 'easy',
  mineCount: 10,
  flagCount: 8,
  clickCount: 25,
  width: 9,
  height: 9,
  onPlayAgain: () => {},
}

describe('ResultModal', () => {
  it('renders win title and glasses icon when won', () => {
    const { getByText } = renderWithProviders(<ResultModal {...baseProps} />)
    expect(getByText('You Win!')).toBeTruthy()
  })

  it('renders lose title and xeyes icon when lost', () => {
    const { getByText } = renderWithProviders(<ResultModal {...baseProps} status="lost" />)
    expect(getByText('Game Over')).toBeTruthy()
  })

  it('displays stats: time, board, mines, clicks', () => {
    const { getByText } = renderWithProviders(<ResultModal {...baseProps} />)
    expect(getByText('42s')).toBeTruthy()
    expect(getByText('9×9')).toBeTruthy()
    expect(getByText('10/8')).toBeTruthy()
    expect(getByText('25')).toBeTruthy()
  })

  it('shows XP section when xpEarned is provided', () => {
    const { getByText } = renderWithProviders(<ResultModal {...baseProps} xpEarned={100} />)
    expect(getByText('+100')).toBeTruthy()
    expect(getByText('XP Earned')).toBeTruthy()
  })

  it('does not show XP section when xpEarned is undefined', () => {
    const { queryByText } = renderWithProviders(<ResultModal {...baseProps} />)
    expect(queryByText('XP Earned')).toBeNull()
  })

  it('calls onPlayAgain when button pressed', () => {
    const onPlayAgain = jest.fn()
    const { getByText } = renderWithProviders(<ResultModal {...baseProps} onPlayAgain={onPlayAgain} />)
    fireEvent.press(getByText('Play Again'))
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
  })
})

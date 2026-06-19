import { render, fireEvent } from '@testing-library/react-native'
import { CellView } from '../CellView'
import { ThemeProvider } from '../../contexts/ThemeContext'
import type { Cell } from '@minesweeper/engine'

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

function hiddenCell(): Cell {
  return { hasMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0, isExploded: false }
}

const defaultProps = { gameStatus: 'idle', onPress: () => {}, onLongPress: () => {} }

describe('CellView', () => {
  it('renders hidden cell', () => {
    const { getByRole } = renderWithTheme(<CellView cell={hiddenCell()} {...defaultProps} />)
    expect(getByRole('button')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByRole } = renderWithTheme(<CellView cell={hiddenCell()} {...defaultProps} onPress={onPress} />)
    fireEvent.press(getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('calls onLongPress when long-pressed', () => {
    const onLongPress = jest.fn()
    const { getByRole } = renderWithTheme(<CellView cell={hiddenCell()} {...defaultProps} onLongPress={onLongPress} />)
    fireEvent(getByRole('button'), 'onLongPress')
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('shows flag icon when flagged', () => {
    const flagged: Cell = { ...hiddenCell(), isFlagged: true }
    const { getByTestId } = renderWithTheme(<CellView cell={flagged} {...defaultProps} />)
    expect(getByTestId('FlagIcon')).toBeTruthy()
  })
})

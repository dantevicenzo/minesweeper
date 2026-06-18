import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GameBoard } from '../GameBoard'

vi.mock('../../hooks/useApiGame', () => ({
  useApiGame: vi.fn(),
}))

vi.mock('../../contexts/I18nContext', () => ({
  useI18n: () => ({
    t: {
      game: {
        mines: 'Mines',
        time: 'Time',
        win: 'You Win!',
        lose: 'Game Over',
        newGame: 'New Game',
        minesweeperBoard: 'Minesweeper board',
        boardLabel: 'Game grid. Use arrow keys to navigate, Enter to reveal, F to flag.',
      },
    },
  }),
}))

vi.mock('../GameBoard.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    counter: 'counter',
    smiley: 'smiley',
    grid: 'grid',
    srOnly: 'srOnly',
  },
}))

vi.mock('../CellView', () => ({
  CellView: vi.fn(() => null),
}))

import { useApiGame } from '../../hooks/useApiGame'

function createMockGame(overrides: Record<string, unknown> = {}) {
  return {
    board: [
      [{ hasMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0, isExploded: false }],
    ],
    status: 'idle' as const,
    flagCount: 0,
    startTime: null,
    ...overrides,
  }
}

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('GameBoard', () => {
  it('renders header with mine counter, smiley, and timer', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame(),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    expect(screen.getAllByRole('timer')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'New Game' })).toBeDefined()
  })

  it('shows smiley face for idle game', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame(),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    const smiley = screen.getByRole('button', { name: 'New Game' })
    expect(smiley.textContent).toBe('🙂')
  })

  it('shows dead face on game over', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'lost' }),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    const smiley = screen.getByRole('button', { name: 'New Game' })
    expect(smiley.textContent).toBe('💀')
  })

  it('shows cool face on win', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'won' }),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    const smiley = screen.getByRole('button', { name: 'New Game' })
    expect(smiley.textContent).toBe('😎')
  })

  it('has role="grid" for the board', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame(),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    expect(screen.getByRole('grid')).toBeDefined()
  })

  it('has aria-live region for announcements', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame(),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    const live = screen.getByRole('status')
    expect(live.getAttribute('aria-live')).toBe('polite')
  })

  it('renders with custom width/height', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({
        board: Array(5).fill(Array(5).fill({ hasMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0, isExploded: false })),
      }),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    const { container } = render(<GameBoard width={5} height={5} mineCount={5} />)
    const grid = container.querySelector('[role="grid"]') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(5, 28px)')
  })

  it('calls dispatch on keyboard Enter', () => {
    const dispatch = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'playing' }),
      dispatch,
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'Enter' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'reveal', row: 0, col: 0 })
  })

  it('calls dispatch on keyboard F', () => {
    const dispatch = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'playing' }),
      dispatch,
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'f' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'flag', row: 0, col: 0 })
  })

  it('calls reset on smiley click', () => {
    const reset = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame(),
      dispatch: vi.fn(),
      reset,
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    fireEvent.click(screen.getByRole('button', { name: 'New Game' }))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('has region role with aria-label', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame(),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    const region = screen.getByRole('region')
    expect(region.getAttribute('aria-label')).toBe('Minesweeper board')
  })
})

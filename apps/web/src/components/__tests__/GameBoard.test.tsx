import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GameBoard } from '../GameBoard'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}))

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
        stats: 'Statistics',
        board: 'Board',
        clicks: 'Clicks',
        xpEarned: 'XP Earned',
        playAgain: 'Play Again',
      },
      home: {
        settings: 'Settings',
        profile: 'Profile',
        leaderboard: 'Leaderboard',
      },
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../GameBoard.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    headerLeft: 'headerLeft',
    headerCenter: 'headerCenter',
    headerRight: 'headerRight',
    headerBtn: 'headerBtn',
    flagActive: 'flagActive',
    counter: 'counter',
    smiley: 'smiley',
    grid: 'grid',
    srOnly: 'srOnly',
    wrapper: 'wrapper',
    scaler: 'scaler',
  },
}))

vi.mock('../CellView', () => ({
  CellView: vi.fn(() => null),
}))

vi.mock('../ResultModal', () => ({
  ResultModal: vi.fn(() => null),
}))

import { useApiGame } from '../../hooks/useApiGame'
import { useAuth } from '../../contexts/AuthContext'
import { ResultModal } from '../ResultModal'

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

describe('GameBoard with ResultModal', () => {
  beforeEach(() => {
    vi.mocked(ResultModal).mockClear()
  })

  it('does not show modal when game is idle', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'idle' }),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    expect(vi.mocked(ResultModal)).not.toHaveBeenCalled()
  })

  it('shows modal when game is won', () => {
    const reset = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'won', flagCount: 3, startTime: Date.now() - 45000 }),
      dispatch: vi.fn(),
      reset,
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="easy" />)
    expect(vi.mocked(ResultModal)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'won',
        mineCount: 10,
        flagCount: 3,
        difficulty: 'easy',
        width: 9,
        height: 9,
      }),
      undefined,
    )
  })

  it('shows modal when game is lost', () => {
    const reset = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'lost', flagCount: 2, startTime: Date.now() - 30000 }),
      dispatch: vi.fn(),
      reset,
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="medium" />)
    expect(vi.mocked(ResultModal)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'lost',
        mineCount: 10,
        flagCount: 2,
        difficulty: 'medium',
      }),
      undefined,
    )
  })

  it('passes xpEarned=100 for easy win with logged user', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'test' } } as any)
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'won', flagCount: 3, startTime: Date.now() - 45000 }),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="easy" />)
    const lastCall = vi.mocked(ResultModal).mock.calls[vi.mocked(ResultModal).mock.calls.length - 1]
    expect(lastCall[0].xpEarned).toBe(100)
  })

  it('calls reset when onPlayAgain is triggered', () => {
    const reset = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'won', flagCount: 3, startTime: Date.now() - 45000 }),
      dispatch: vi.fn(),
      reset,
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="easy" />)
    const lastCall = vi.mocked(ResultModal).mock.calls[vi.mocked(ResultModal).mock.calls.length - 1]
    lastCall[0].onPlayAgain()
    expect(reset).toHaveBeenCalledTimes(1)
  })
})

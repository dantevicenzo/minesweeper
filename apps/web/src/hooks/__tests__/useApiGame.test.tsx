import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useApiGame } from '../useApiGame'

const mockDispatch = vi.fn()
const mockReset = vi.fn()

vi.mock('@minesweeper/hooks', () => ({
  useGame: vi.fn(() => ({
    game: {
      board: [[{ hasMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0, isExploded: false }]],
      status: 'idle',
      flagCount: 0,
      startTime: null,
    },
    dispatch: mockDispatch,
    reset: mockReset,
  })),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}))

vi.mock('../../lib/storage', () => ({
  saveGameLocally: vi.fn(),
  clearSavedGame: vi.fn(),
}))

vi.mock('../../services/gameSync', () => ({
  saveGameToCloud: vi.fn(() => Promise.resolve('game-id')),
  saveCompletedGameToCloud: vi.fn(() => Promise.resolve('game-id')),
  serializeGame: vi.fn(() => ({ board: [] })),
}))

vi.mock('../../lib/sync', () => ({
  isOnline: vi.fn(() => true),
}))

import { useGame } from '@minesweeper/hooks'
import { useAuth } from '../../contexts/AuthContext'
import { saveGameLocally, clearSavedGame } from '../../lib/storage'
import { saveGameToCloud, saveCompletedGameToCloud } from '../../services/gameSync'

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('useApiGame', () => {
  it('returns game, dispatch, reset', () => {
    const { result } = renderHook(() => useApiGame(9, 9, 10, 'easy'))
    expect(result.current.game).toBeDefined()
    expect(result.current.dispatch).toBeDefined()
    expect(result.current.reset).toBeDefined()
  })

  it('calls saveGameLocally on game change', () => {
    renderHook(() => useApiGame(9, 9, 10, 'easy'))

    expect(saveGameLocally).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 9,
        height: 9,
        mineCount: 10,
        difficulty: 'easy',
      })
    )
  })

  it('clears saved game on game end', () => {
    vi.mocked(useGame).mockReturnValue({
      game: { board: [], status: 'won', flagCount: 0, startTime: Date.now() },
      dispatch: mockDispatch,
      reset: mockReset,
    } as any)

    renderHook(() => useApiGame(9, 9, 10, 'easy'))
    expect(clearSavedGame).toHaveBeenCalled()
  })

  it('calls saveCompletedGameToCloud when user is authenticated and game is won', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user' } } as any)
    vi.mocked(useGame).mockReturnValue({
      game: { board: [[{ hasMine: false, isRevealed: true, isFlagged: false, adjacentMines: 0, isExploded: false }]], status: 'won', flagCount: 0, startTime: Date.now() },
      dispatch: mockDispatch,
      reset: mockReset,
    } as any)

    renderHook(() => useApiGame(9, 9, 10, 'easy'))
    expect(saveCompletedGameToCloud).toHaveBeenCalled()
  })

  it('does not call saveCompletedGameToCloud when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any)
    vi.mocked(useGame).mockReturnValue({
      game: { board: [], status: 'won', flagCount: 0, startTime: null },
      dispatch: mockDispatch,
      reset: mockReset,
    } as any)

    renderHook(() => useApiGame(9, 9, 10, 'easy'))
    expect(saveCompletedGameToCloud).not.toHaveBeenCalled()
  })

  it('calls wrappedReset which clears gameIdRef and saved game', () => {
    const { result } = renderHook(() => useApiGame(9, 9, 10, 'easy'))

    act(() => {
      result.current.reset()
    })

    expect(clearSavedGame).toHaveBeenCalled()
    expect(mockReset).toHaveBeenCalled()
  })

  it('calls dispatch when wrappedDispatch is invoked', () => {
    const { result } = renderHook(() => useApiGame(9, 9, 10, 'easy'))

    act(() => {
      result.current.dispatch({ type: 'reveal', row: 0, col: 0 })
    })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'reveal', row: 0, col: 0 })
  })
})

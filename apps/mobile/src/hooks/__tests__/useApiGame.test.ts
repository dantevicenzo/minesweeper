jest.mock('@minesweeper/hooks', () => ({
  useGame: jest.fn(),
}))

jest.mock('../../lib/storage', () => ({
  saveGameLocally: jest.fn(),
  clearSavedGame: jest.fn(),
}))

jest.mock('../../services/gameSync', () => ({
  saveGameToCloud: jest.fn(),
  saveCompletedGameToCloud: jest.fn(),
}))

import { renderHook, act } from '@testing-library/react-native'
import { useGame } from '@minesweeper/hooks'
import { useApiGame } from '../useApiGame'
import { saveGameLocally, clearSavedGame } from '../../lib/storage'
import {
  saveGameToCloud,
  saveCompletedGameToCloud,
} from '../../services/gameSync'
import type { GameState } from '@minesweeper/engine'

const mockDispatch = jest.fn()
const mockReset = jest.fn()

function createMockGame(overrides: Partial<GameState> = {}): GameState {
  return {
    board: [],
    status: 'idle',
    width: 9,
    height: 9,
    mineCount: 10,
    flagCount: 0,
    startTime: null,
    elapsedTime: 0,
    minesPlaced: false,
    ...overrides,
  }
}

let currentGame: GameState

beforeEach(() => {
  jest.clearAllMocks()
  currentGame = createMockGame()
  ;(useGame as jest.Mock).mockReturnValue({
    game: currentGame,
    dispatch: mockDispatch,
    reset: mockReset,
  })
  ;(saveGameLocally as jest.Mock).mockResolvedValue(undefined)
  ;(clearSavedGame as jest.Mock).mockResolvedValue(undefined)
  ;(saveGameToCloud as jest.Mock).mockResolvedValue('cloud-id')
  ;(saveCompletedGameToCloud as jest.Mock).mockResolvedValue('cloud-id')
})

function updateGame(overrides: Partial<GameState>) {
  currentGame = createMockGame({ ...currentGame, ...overrides })
  ;(useGame as jest.Mock).mockReturnValue({
    game: currentGame,
    dispatch: mockDispatch,
    reset: mockReset,
  })
}

describe('useApiGame', () => {
  it('returns game, dispatch, and reset', () => {
    const { result } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    expect(result.current.game).toBeDefined()
    expect(typeof result.current.dispatch).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  it('dispatch calls the underlying game dispatch', () => {
    const { result } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))
    const action = { type: 'reveal' as const, row: 0, col: 0 }

    act(() => {
      result.current.dispatch(action)
    })

    expect(mockDispatch).toHaveBeenCalledWith(action)
  })

  it('saves game to AsyncStorage on game state change', () => {
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    updateGame({ status: 'playing', elapsedTime: 500 })
    rerender(undefined as any)

    expect(saveGameLocally).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 9,
        height: 9,
        mineCount: 10,
        difficulty: 'easy',
        state: expect.objectContaining({ status: 'playing' }),
      }),
    )
  })

  it('debounces cloud save by 3 seconds while playing', () => {
    jest.useFakeTimers()
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    updateGame({ status: 'playing' })
    rerender(undefined as any)

    expect(saveGameToCloud).not.toHaveBeenCalled()

    jest.advanceTimersByTime(3000)

    expect(saveGameToCloud).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  it('resets debounce timer on new state change', () => {
    jest.useFakeTimers()
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    updateGame({ status: 'playing' })
    rerender(undefined as any)

    jest.advanceTimersByTime(2000)

    updateGame({ elapsedTime: 2000 })
    rerender(undefined as any)

    jest.advanceTimersByTime(2000)

    expect(saveGameToCloud).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    expect(saveGameToCloud).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  it('does NOT cloud save when game is idle', () => {
    jest.useFakeTimers()
    renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    jest.advanceTimersByTime(5000)

    expect(saveGameToCloud).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('does NOT cloud save when userId is null', () => {
    jest.useFakeTimers()
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy'))

    updateGame({ status: 'playing' })
    rerender(undefined as any)

    jest.advanceTimersByTime(3000)

    expect(saveGameToCloud).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('does NOT cloud save when difficulty is undefined', () => {
    jest.useFakeTimers()
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, undefined, 'user-1'))

    updateGame({ status: 'playing' })
    rerender(undefined as any)

    jest.advanceTimersByTime(3000)

    expect(saveGameToCloud).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('syncs completed game to cloud and clears local save on win', () => {
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    updateGame({ status: 'won' })
    rerender(undefined as any)

    expect(saveCompletedGameToCloud).toHaveBeenCalled()
    expect(clearSavedGame).toHaveBeenCalled()
  })

  it('clears local save on loss without cloud sync', () => {
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    updateGame({ status: 'lost' })
    rerender(undefined as any)

    expect(clearSavedGame).toHaveBeenCalled()
    expect(saveCompletedGameToCloud).not.toHaveBeenCalled()
  })

  it('does not sync on loss even when logged in', () => {
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    updateGame({ status: 'lost' })
    rerender(undefined as any)

    expect(saveCompletedGameToCloud).not.toHaveBeenCalled()
  })

  it('does not sync to cloud on win when userId is null', () => {
    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy'))

    updateGame({ status: 'won' })
    rerender(undefined as any)

    expect(saveCompletedGameToCloud).not.toHaveBeenCalled()
    expect(clearSavedGame).toHaveBeenCalled()
  })

  it('reset clears gameId and calls gameReset', () => {
    const { result } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    act(() => {
      result.current.reset()
    })

    expect(mockReset).toHaveBeenCalled()
  })

  it('restores gameId from cloud save result', async () => {
    jest.useFakeTimers()
    ;(saveGameToCloud as jest.Mock).mockResolvedValue('returned-id')

    const { rerender } = renderHook(() => useApiGame(9, 9, 10, 'easy', 'user-1'))

    updateGame({ status: 'playing' })
    rerender(undefined as any)

    jest.advanceTimersByTime(3000)
    await act(async () => {})

    expect(saveGameToCloud).toHaveBeenCalled()

    updateGame({ status: 'won' })
    rerender(undefined as any)

    expect(saveCompletedGameToCloud).toHaveBeenCalledWith(
      expect.any(Object),
      'easy',
      'returned-id',
    )
    jest.useRealTimers()
  })
})

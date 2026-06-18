import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGame } from '../useGame'

describe('useGame', () => {
  it('initializes a game with given dimensions', () => {
    const { result } = renderHook(() => useGame(9, 9, 10))

    expect(result.current.game.width).toBe(9)
    expect(result.current.game.height).toBe(9)
    expect(result.current.game.mineCount).toBe(10)
    expect(result.current.game.status).toBe('idle')
    expect(result.current.game.board.length).toBe(9)
    expect(result.current.game.board[0].length).toBe(9)
  })

  it('reveals a cell on dispatch', () => {
    const { result } = renderHook(() => useGame(9, 9, 10))

    act(() => {
      result.current.dispatch({ type: 'reveal', row: 4, col: 4 })
    })

    expect(result.current.game.status).toBe('playing')
    expect(result.current.game.board[4][4].isRevealed).toBe(true)
  })

  it('flags a cell on dispatch', () => {
    const { result } = renderHook(() => useGame(9, 9, 10))

    act(() => {
      result.current.dispatch({ type: 'flag', row: 2, col: 3 })
    })

    expect(result.current.game.board[2][3].isFlagged).toBe(true)
  })

  it('toggles flag on second flag dispatch', () => {
    const { result } = renderHook(() => useGame(9, 9, 10))

    act(() => {
      result.current.dispatch({ type: 'flag', row: 2, col: 3 })
    })

    expect(result.current.game.board[2][3].isFlagged).toBe(true)

    act(() => {
      result.current.dispatch({ type: 'flag', row: 2, col: 3 })
    })

    expect(result.current.game.board[2][3].isFlagged).toBe(false)
  })

  it('resets to initial state on reset', () => {
    const { result } = renderHook(() => useGame(9, 9, 10))

    act(() => {
      result.current.dispatch({ type: 'reveal', row: 4, col: 4 })
    })

    expect(result.current.game.status).toBe('playing')

    act(() => {
      result.current.reset()
    })

    expect(result.current.game.status).toBe('idle')
    expect(result.current.game.board[4][4].isRevealed).toBe(false)
  })

  it('initializes with partial state when provided', () => {
    const partialState = {
      width: 9,
      height: 9,
      mineCount: 10,
      status: 'won' as const,
      flagCount: 2,
      board: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({
          hasMine: false,
          isRevealed: false,
          isFlagged: false,
          isExploded: false,
          adjacentMines: 0,
        }))
      ),
    }

    const { result } = renderHook(() => useGame(9, 9, 10, partialState))

    expect(result.current.game.status).toBe('won')
    expect(result.current.game.flagCount).toBe(2)
  })

  it('chord reveals neighbors', () => {
    const { result } = renderHook(() => useGame(9, 9, 10))

    act(() => {
      result.current.dispatch({ type: 'reveal', row: 4, col: 4 })
    })

    const revealed4x4 = result.current.game.board[4][4].isRevealed

    act(() => {
      result.current.dispatch({ type: 'chord', row: 4, col: 4 })
    })

    expect(result.current.game.board[4][4].isRevealed).toBe(revealed4x4)
  })
})

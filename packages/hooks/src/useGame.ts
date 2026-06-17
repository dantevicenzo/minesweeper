import { useState, useCallback } from 'react'
import { createGame, applyAction } from '@minesweeper/engine'
import type { GameState, GameAction } from '@minesweeper/engine'

export function useGame(width: number, height: number, mineCount: number, initialState?: Partial<GameState>) {
  const [game, setGame] = useState<GameState>(() => {
    if (initialState) {
      return {
        board: initialState.board ?? [],
        status: initialState.status ?? 'idle',
        width: initialState.width ?? width,
        height: initialState.height ?? height,
        mineCount: initialState.mineCount ?? mineCount,
        flagCount: initialState.flagCount ?? 0,
        startTime: initialState.startTime ?? null,
        elapsedTime: initialState.elapsedTime ?? 0,
        minesPlaced: initialState.minesPlaced ?? false,
      }
    }
    return createGame(width, height, mineCount)
  })

  const dispatch = useCallback(
    (action: GameAction) => {
      setGame(prev => applyAction(prev, action))
    },
    []
  )

  const reset = useCallback(() => {
    setGame(createGame(width, height, mineCount))
  }, [width, height, mineCount])

  return { game, dispatch, reset }
}

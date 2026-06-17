import { useState, useCallback } from 'react'
import { createGame, applyAction } from '@minesweeper/engine'
import type { GameState, GameAction } from '@minesweeper/engine'

export function useGame(width: number, height: number, mineCount: number) {
  const [game, setGame] = useState<GameState>(() => createGame(width, height, mineCount))

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

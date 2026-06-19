import { useRef, useCallback, useEffect } from 'react'
import { useGame } from '@minesweeper/hooks'
import { saveGameLocally, clearSavedGame } from '../lib/storage'
import { saveGameToCloud, saveCompletedGameToCloud } from '../services/gameSync'
import type { GameAction } from '@minesweeper/engine'

const DEBOUNCE_MS = 3000

export function useApiGame(
  width: number,
  height: number,
  mineCount: number,
  difficulty?: string,
  userId?: string | null,
) {
  const { game, dispatch: gameDispatch, reset: gameReset } = useGame(width, height, mineCount)
  const gameIdRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevStatusRef = useRef(game.status)
  const userIdRef = useRef(userId)
  const difficultyRef = useRef(difficulty)

  userIdRef.current = userId
  difficultyRef.current = difficulty

  const dispatch = useCallback(
    (action: GameAction) => {
      gameDispatch(action)
    },
    [gameDispatch],
  )

  useEffect(() => {
    saveGameLocally({
      width: game.width,
      height: game.height,
      mineCount: game.mineCount,
      difficulty: difficultyRef.current ?? 'custom',
      state: game,
      updatedAt: Date.now(),
    }).catch(() => {})
  }, [game])

  useEffect(() => {
    if (game.status !== 'playing') return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (userIdRef.current && difficultyRef.current) {
        saveGameToCloud(game, difficultyRef.current, gameIdRef.current).then(id => {
          gameIdRef.current = id
        })
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [game])

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = game.status

    if (game.status === 'won' && prevStatus !== 'won') {
      clearSavedGame().catch(() => {})

      if (userIdRef.current && difficultyRef.current) {
        saveCompletedGameToCloud(game, difficultyRef.current, gameIdRef.current).then(id => {
          gameIdRef.current = id
        })
      }
    } else if (game.status === 'lost' && prevStatus !== 'lost') {
      clearSavedGame().catch(() => {})
    }
  }, [game])

  const reset = useCallback(() => {
    gameIdRef.current = null
    gameReset()
  }, [gameReset])

  return { game, dispatch, reset }
}

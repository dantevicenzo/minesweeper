'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useGame } from '@minesweeper/hooks'
import { useAuth } from '../contexts/AuthContext'
import { saveGameLocally, clearSavedGame } from '../lib/storage'
import { saveGameToCloud, saveCompletedGameToCloud, serializeGame } from '../services/gameSync'
import { isOnline } from '../lib/sync'
import type { GameAction, GameState } from '@minesweeper/engine'

export function useApiGame(width: number, height: number, mineCount: number, difficulty: string, initialState?: Partial<GameState>) {
  const { game, dispatch, reset } = useGame(width, height, mineCount, initialState)
  const { user } = useAuth()
  const gameIdRef = useRef<string | null>(null)
  const statusRef = useRef(game.status)
  const gameRef = useRef(game)

  gameRef.current = game

  useEffect(() => {
    saveGameLocally({
      width, height, mineCount, difficulty,
      state: serializeGame(game),
      updatedAt: Date.now(),
    })
  }, [game.board, game.status, game.flagCount, game.startTime, width, height, mineCount, difficulty])

  useEffect(() => {
    const currentStatus = game.status
    statusRef.current = currentStatus

    if (currentStatus === 'won' || currentStatus === 'lost') {
      if (user && isOnline()) {
        saveCompletedGameToCloud(gameRef.current, difficulty, gameIdRef.current)
          .then(id => { gameIdRef.current = id })
          .catch(err => console.error('[useApiGame] Failed to save completed game:', err))
      }
    }

    if (currentStatus !== 'idle' && currentStatus !== 'playing') {
      clearSavedGame()
    }
  }, [game.status, user, difficulty])

  useEffect(() => {
    if (!user || game.status !== 'playing') return

    const timer = setTimeout(() => {
      if (!isOnline()) return
      saveGameToCloud(gameRef.current, difficulty, gameIdRef.current)
        .then(id => { gameIdRef.current = id })
        .catch(err => console.error('[useApiGame] Auto-save failed:', err))
    }, 3000)

    return () => clearTimeout(timer)
  }, [game.board, game.status, user, width, height, mineCount, difficulty])

  const wrappedDispatch = useCallback((action: GameAction) => {
    dispatch(action)
  }, [dispatch])

  const wrappedReset = useCallback(() => {
    gameIdRef.current = null
    statusRef.current = 'idle'
    clearSavedGame()
    reset()
  }, [reset])

  return { game, dispatch: wrappedDispatch, reset: wrappedReset }
}

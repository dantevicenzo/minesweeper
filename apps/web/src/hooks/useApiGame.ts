'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useGame } from '@minesweeper/hooks'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import type { GameAction, GameState } from '@minesweeper/engine'

export function useApiGame(width: number, height: number, mineCount: number, difficulty: string) {
  const { game, dispatch, reset } = useGame(width, height, mineCount)
  const { user } = useAuth()
  const gameIdRef = useRef<string | null>(null)
  const statusRef = useRef(game.status)
  const gameRef = useRef(game)

  gameRef.current = game

  useEffect(() => {
    if (!user) return

    const currentStatus = game.status
    const prevStatus = statusRef.current
    statusRef.current = currentStatus

    if (currentStatus === 'won' || currentStatus === 'lost') {
      saveCompletedGame(gameRef.current, difficulty, gameIdRef.current)
        .then(id => { gameIdRef.current = id })
        .catch(() => {})
    }
  }, [game.status, user, difficulty])

  useEffect(() => {
    if (!user || game.status !== 'playing') return

    const timer = setTimeout(() => {
      const g = gameRef.current
      const state = serializeGame(g)

      if (gameIdRef.current) {
        api.games.update(gameIdRef.current, { state }).catch(() => {})
      } else {
        api.games.create({
          width, height, mineCount, difficulty, state,
        })
          .then(data => { gameIdRef.current = (data as { id: string }).id })
          .catch(() => {})
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [game.board, game.status, user, width, height, mineCount, difficulty])

  const wrappedDispatch = useCallback((action: GameAction) => {
    dispatch(action)
  }, [dispatch])

  const wrappedReset = useCallback(() => {
    gameIdRef.current = null
    statusRef.current = 'idle'
    reset()
  }, [reset])

  return { game, dispatch: wrappedDispatch, reset: wrappedReset }
}

function serializeGame(game: GameState) {
  return {
    board: game.board,
    status: game.status,
    mineCount: game.mineCount,
    flagCount: game.flagCount,
    startTime: game.startTime,
    elapsedTime: game.elapsedTime,
  }
}

async function saveCompletedGame(
  game: GameState,
  difficulty: string,
  existingId: string | null
): Promise<string | null> {
  const state = serializeGame(game)
  const durationMs = game.startTime ? Date.now() - game.startTime : 0

  if (existingId) {
    await api.games.update(existingId, {
      state,
      status: game.status,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    })
    return existingId
  }

  const data = await api.games.create({
    width: game.width,
    height: game.height,
    mineCount: game.mineCount,
    difficulty,
    state,
    status: game.status,
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
  })

  return (data as { id: string }).id ?? null
}

import { api } from '../lib/api'
import type { GameState } from '@minesweeper/engine'

export interface SerializedGame {
  board: GameState['board']
  status: GameState['status']
  width: number
  height: number
  mineCount: number
  flagCount: number
  startTime: number | null
  elapsedTime: number
  minesPlaced: boolean
}

export function serializeGame(game: GameState): SerializedGame {
  return {
    board: game.board,
    status: game.status,
    width: game.width,
    height: game.height,
    mineCount: game.mineCount,
    flagCount: game.flagCount,
    startTime: game.startTime,
    elapsedTime: game.elapsedTime,
    minesPlaced: game.minesPlaced,
  }
}

export async function saveGameToCloud(
  game: GameState,
  difficulty: string,
  gameId: string | null
): Promise<string | null> {
  const state = serializeGame(game)

  if (gameId) {
    await api.games.update(gameId, { state })
    return gameId
  }

  const data = await api.games.create({
    width: game.width,
    height: game.height,
    mineCount: game.mineCount,
    difficulty,
    state,
  })

  return (data as { id: string }).id ?? null
}

export async function saveCompletedGameToCloud(
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

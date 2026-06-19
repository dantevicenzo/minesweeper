import { api } from '../lib/api'
import type { GameState } from '@minesweeper/engine'

export async function saveGameToCloud(
  game: GameState,
  difficulty: string,
  gameId: string | null,
): Promise<string | null> {
  try {
    const data = {
      width: game.width,
      height: game.height,
      mineCount: game.mineCount,
      difficulty,
      board: JSON.stringify(game.board),
      flagCount: game.flagCount,
      startTime: game.startTime,
      elapsedTime: game.elapsedTime,
      minesPlaced: game.minesPlaced,
    }

    if (gameId) {
      await api.games.update(gameId, data)
      return gameId
    }

    const result = await api.games.create(data)
    return (result as { id: string }).id
  } catch {
    return gameId ?? null
  }
}

export async function saveCompletedGameToCloud(
  game: GameState,
  difficulty: string,
  existingId: string | null,
): Promise<string | null> {
  try {
    const data = {
      width: game.width,
      height: game.height,
      mineCount: game.mineCount,
      difficulty,
      board: JSON.stringify(game.board),
      flagCount: game.flagCount,
      startTime: game.startTime,
      elapsedTime: game.elapsedTime,
      minesPlaced: game.minesPlaced,
      status: game.status,
      completed_at: new Date().toISOString(),
      duration_ms: game.elapsedTime,
    }

    if (existingId) {
      await api.games.update(existingId, data)
      return existingId
    }

    const result = await api.games.create(data)
    return (result as { id: string }).id
  } catch {
    return existingId ?? null
  }
}

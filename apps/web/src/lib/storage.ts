const SAVED_GAME_KEY = 'minesweeper_saved_game'

interface SavedGame {
  width: number
  height: number
  mineCount: number
  difficulty: string
  state: unknown
  updatedAt: number
}

export function saveGameLocally(data: SavedGame): void {
  try {
    localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(data))
  } catch {
    /* storage full or unavailable */
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVED_GAME_KEY)
  } catch {}
}

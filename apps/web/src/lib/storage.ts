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

export function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVED_GAME_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedGame
  } catch {
    return null
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVED_GAME_KEY)
  } catch {}
}

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVED_GAME_KEY) !== null
  } catch {
    return false
  }
}

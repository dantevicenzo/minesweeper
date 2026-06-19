import AsyncStorage from '@react-native-async-storage/async-storage'

const SAVED_GAME_KEY = 'minesweeper_saved_game'

interface SavedGame {
  width: number
  height: number
  mineCount: number
  difficulty: string
  state: unknown
  updatedAt: number
}

export async function saveGameLocally(data: SavedGame): Promise<void> {
  await AsyncStorage.setItem(SAVED_GAME_KEY, JSON.stringify(data))
}

export async function loadSavedGame(): Promise<SavedGame | null> {
  const raw = await AsyncStorage.getItem(SAVED_GAME_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function clearSavedGame(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_GAME_KEY)
}

export async function hasSavedGame(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SAVED_GAME_KEY)
  return raw !== null
}

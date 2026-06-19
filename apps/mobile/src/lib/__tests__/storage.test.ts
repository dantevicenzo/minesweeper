jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import AsyncStorage from '@react-native-async-storage/async-storage'
import { saveGameLocally, loadSavedGame, clearSavedGame, hasSavedGame } from '../storage'

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('saves and loads a game', async () => {
    const game = { width: 9, height: 9, mineCount: 10, difficulty: 'easy', state: { board: [] }, updatedAt: Date.now() }
    await saveGameLocally(game)
    const loaded = await loadSavedGame()
    expect(loaded?.width).toBe(9)
    expect(loaded?.difficulty).toBe('easy')
  })

  it('returns null when no saved game exists', async () => {
    const loaded = await loadSavedGame()
    expect(loaded).toBeNull()
  })

  it('clears saved game', async () => {
    await saveGameLocally({ width: 9, height: 9, mineCount: 10, difficulty: 'easy', state: {}, updatedAt: 1 })
    await clearSavedGame()
    expect(await hasSavedGame()).toBe(false)
  })

  it('detects existing saved game', async () => {
    expect(await hasSavedGame()).toBe(false)
    await saveGameLocally({ width: 9, height: 9, mineCount: 10, difficulty: 'easy', state: {}, updatedAt: 1 })
    expect(await hasSavedGame()).toBe(true)
  })
})

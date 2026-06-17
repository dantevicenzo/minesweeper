import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveGameLocally, loadSavedGame, clearSavedGame, hasSavedGame } from '../storage'

beforeEach(() => {
  localStorage.clear()
})

describe('storage', () => {
  const sampleData = {
    width: 9,
    height: 9,
    mineCount: 10,
    difficulty: 'easy',
    state: { foo: 'bar' },
    updatedAt: 1000,
  }

  it('saves and loads a game', () => {
    saveGameLocally(sampleData)
    const loaded = loadSavedGame()
    expect(loaded).toEqual(sampleData)
  })

  it('returns null when no saved game', () => {
    expect(loadSavedGame()).toBeNull()
  })

  it('clears a saved game', () => {
    saveGameLocally(sampleData)
    clearSavedGame()
    expect(loadSavedGame()).toBeNull()
  })

  it('hasSavedGame returns true when game saved', () => {
    saveGameLocally(sampleData)
    expect(hasSavedGame()).toBe(true)
  })

  it('hasSavedGame returns false when no game saved', () => {
    expect(hasSavedGame()).toBe(false)
  })

  it('overwrites existing saved game', () => {
    saveGameLocally(sampleData)
    const updated = { ...sampleData, difficulty: 'hard', updatedAt: 2000 }
    saveGameLocally(updated)
    expect(loadSavedGame()).toEqual(updated)
  })

  it('handles localStorage being full', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError') })

    expect(() => saveGameLocally(sampleData)).not.toThrow()
    setItem.mockRestore()
  })

  it('handles corrupt localStorage data', () => {
    localStorage.setItem('minesweeper_saved_game', 'not-json')
    expect(loadSavedGame()).toBeNull()
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveGameLocally, clearSavedGame } from '../storage'

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

  it('saves game to localStorage without throwing', () => {
    expect(() => saveGameLocally(sampleData)).not.toThrow()
    const raw = localStorage.getItem('minesweeper_saved_game')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual(sampleData)
  })

  it('clears saved game from localStorage', () => {
    saveGameLocally(sampleData)
    clearSavedGame()
    expect(localStorage.getItem('minesweeper_saved_game')).toBeNull()
  })

  it('handles localStorage being full', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError') })

    expect(() => saveGameLocally(sampleData)).not.toThrow()
    setItem.mockRestore()
  })
})

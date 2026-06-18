import { describe, it, expect } from 'vitest'
import { validateGameTime } from '../../api/services/antiCheat'

describe('AntiCheat', () => {
  it('allows reasonable easy game time', () => {
    expect(validateGameTime(15000, 'easy', 9, 9).valid).toBe(true)
  })

  it('rejects impossibly fast easy game', () => {
    expect(validateGameTime(100, 'easy', 9, 9).valid).toBe(false)
  })

  it('allows reasonable medium game time', () => {
    expect(validateGameTime(60000, 'medium', 16, 16).valid).toBe(true)
  })

  it('rejects impossibly fast medium game', () => {
    expect(validateGameTime(500, 'medium', 16, 16).valid).toBe(false)
  })

  it('allows reasonable hard game time', () => {
    expect(validateGameTime(200000, 'hard', 30, 16).valid).toBe(true)
  })

  it('rejects impossibly fast hard game', () => {
    expect(validateGameTime(1000, 'hard', 30, 16).valid).toBe(false)
  })

  it('allows reasonable custom game time', () => {
    expect(validateGameTime(60000, 'custom', 20, 20).valid).toBe(true)
  })

  it('rejects impossibly fast custom game', () => {
    expect(validateGameTime(100, 'custom', 20, 20).valid).toBe(false)
  })
})

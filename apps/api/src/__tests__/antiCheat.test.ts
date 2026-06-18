import { describe, it, expect } from 'vitest'
import { validateGameTime, validateTimeConsistency } from '../../api/services/antiCheat'

describe('AntiCheat — validateGameTime', () => {
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
    expect(validateGameTime(60000, 'custom', 20, 20, 50).valid).toBe(true)
  })

  it('rejects impossibly fast custom game', () => {
    expect(validateGameTime(100, 'custom', 20, 20, 50).valid).toBe(false)
  })

  it('allows fast time on custom board with almost all mines', () => {
    expect(validateGameTime(1500, 'custom', 100, 100, 9999).valid).toBe(true)
  })

  it('rejects fast time on custom board with few mines', () => {
    expect(validateGameTime(1500, 'custom', 100, 100, 1).valid).toBe(false)
  })
})

describe('AntiCheat — validateTimeConsistency', () => {
  it('accepts consistent times', () => {
    const start = new Date(Date.now() - 10000).toISOString()
    const serverCompleted = new Date()
    expect(validateTimeConsistency(start, serverCompleted, 10000).valid).toBe(true)
  })

  it('accepts times within tolerance', () => {
    const start = new Date(Date.now() - 12000).toISOString()
    const serverCompleted = new Date()
    expect(validateTimeConsistency(start, serverCompleted, 10000).valid).toBe(true)
  })

  it('rejects drastically inconsistent times', () => {
    const start = new Date(Date.now() - 60000).toISOString()
    const serverCompleted = new Date()
    const result = validateTimeConsistency(start, serverCompleted, 10000)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('inconsistency')
  })

  it('rejects reported time much larger than elapsed', () => {
    const start = new Date(Date.now() - 5000).toISOString()
    const serverCompleted = new Date()
    const result = validateTimeConsistency(start, serverCompleted, 60000)
    expect(result.valid).toBe(false)
  })
})

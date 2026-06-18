import { describe, it, expect } from 'vitest'
import { clamp, formatTime, shuffleArray } from '../index'

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('returns min when value is below', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('returns max when value is above', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('works with negative ranges', () => {
    expect(clamp(-10, -5, -1)).toBe(-5)
  })

  it('works with zero range', () => {
    expect(clamp(100, 5, 5)).toBe(5)
  })

  it('works with floating point', () => {
    expect(clamp(3.5, 1.0, 5.0)).toBe(3.5)
    expect(clamp(0.5, 1.0, 5.0)).toBe(1.0)
    expect(clamp(7.5, 1.0, 5.0)).toBe(5.0)
  })
})

describe('formatTime', () => {
  it('formats zero', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('formats seconds only', () => {
    expect(formatTime(5000)).toBe('0:05')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(65000)).toBe('1:05')
  })

  it('pads single digit seconds', () => {
    expect(formatTime(3000)).toBe('0:03')
    expect(formatTime(63000)).toBe('1:03')
  })

  it('handles large values', () => {
    expect(formatTime(3661000)).toBe('61:01')
  })

  it('rounds down milliseconds', () => {
    expect(formatTime(1999)).toBe('0:01')
    expect(formatTime(1000)).toBe('0:01')
    expect(formatTime(999)).toBe('0:00')
  })
})

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result).toHaveLength(input.length)
  })

  it('does not mutate original array', () => {
    const input = [1, 2, 3, 4, 5]
    const original = [...input]
    shuffleArray(input)
    expect(input).toEqual(original)
  })

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result.sort()).toEqual(input.sort())
  })

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([])
  })

  it('handles single element', () => {
    expect(shuffleArray([42])).toEqual([42])
  })

  it('handles array with duplicates', () => {
    const input = [1, 1, 2, 2, 3]
    const result = shuffleArray(input)
    expect(result.sort()).toEqual(input.sort())
    expect(result).toHaveLength(5)
  })
})

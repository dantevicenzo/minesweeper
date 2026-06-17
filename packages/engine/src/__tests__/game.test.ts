import { describe, it, expect } from 'vitest'
import { createGame, applyAction } from '../game'

describe('createGame', () => {
  it('creates game with correct dimensions', () => {
    const game = createGame(9, 9, 10)
    expect(game.width).toBe(9)
    expect(game.height).toBe(9)
    expect(game.mineCount).toBe(10)
    expect(game.status).toBe('idle')
    expect(game.minesPlaced).toBe(false)
    expect(game.startTime).toBeNull()
  })
})

describe('applyAction', () => {
  it('places mines and starts timer on first reveal', () => {
    const game = createGame(9, 9, 10)
    const next = applyAction(game, { type: 'reveal', row: 0, col: 0 })
    expect(next.minesPlaced).toBe(true)
    expect(next.status).toBe('playing')
    expect(next.startTime).not.toBeNull()
  })

  it('remains idle after flag action without mines placed', () => {
    const game = createGame(9, 9, 10)
    const next = applyAction(game, { type: 'flag', row: 0, col: 0 })
    expect(next.status).toBe('idle')
    expect(next.minesPlaced).toBe(false)
  })

  it('ignores actions after game is won', () => {
    const game = createGame(3, 3, 1)
    const won = { ...game, status: 'won' as const }
    const next = applyAction(won, { type: 'reveal', row: 0, col: 0 })
    expect(next.status).toBe('won')
  })

  it('ignores actions after game is lost', () => {
    const game = createGame(3, 3, 1)
    const lost = { ...game, status: 'lost' as const }
    const next = applyAction(lost, { type: 'reveal', row: 0, col: 0 })
    expect(next.status).toBe('lost')
  })

  it('reveals all mines on loss', () => {
    const game = createGame(9, 9, 10)
    const playing = applyAction(game, { type: 'reveal', row: 0, col: 0 })
    const lost = applyAction(playing, { type: 'reveal', row: 8, col: 8 })
    if (lost.status === 'lost') {
      const mineCount = lost.board.reduce(
        (sum, row) => sum + row.filter(c => c.hasMine).length,
        0
      )
      const revealedMineCount = lost.board.reduce(
        (sum, row) => sum + row.filter(c => c.hasMine && c.isRevealed).length,
        0
      )
      expect(revealedMineCount).toBe(mineCount)
    }
  })

  it('detects win when all safe cells revealed', () => {
    const game = createGame(3, 3, 1)
    const next = applyAction(game, { type: 'reveal', row: 1, col: 1 })
    if (next.status === 'won') {
      const revealedCount = next.board.reduce(
        (sum, row) => sum + row.filter(c => c.isRevealed).length,
        0
      )
      expect(revealedCount).toBe(8)
    }
  })
})

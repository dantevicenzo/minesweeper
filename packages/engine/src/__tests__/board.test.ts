import { describe, it, expect } from 'vitest'
import {
  createEmptyBoard,
  placeMines,
  revealCell,
  toggleFlag,
  chordReveal,
  checkWin,
  countFlags,
  getNeighbors,
} from '../board'

describe('createEmptyBoard', () => {
  it('creates a board with correct dimensions', () => {
    const board = createEmptyBoard(9, 9)
    expect(board.length).toBe(9)
    expect(board[0].length).toBe(9)
  })

  it('all cells are empty and not revealed or flagged', () => {
    const board = createEmptyBoard(5, 5)
    for (const row of board) {
      for (const cell of row) {
        expect(cell.hasMine).toBe(false)
        expect(cell.isRevealed).toBe(false)
        expect(cell.isFlagged).toBe(false)
        expect(cell.adjacentMines).toBe(0)
      }
    }
  })
})

describe('getNeighbors', () => {
  it('returns 8 neighbors for a center cell', () => {
    const neighbors = getNeighbors(1, 1, 5, 5)
    expect(neighbors).toHaveLength(8)
  })

  it('returns 3 neighbors for a corner cell', () => {
    const neighbors = getNeighbors(0, 0, 5, 5)
    expect(neighbors).toHaveLength(3)
  })

  it('returns 5 neighbors for an edge cell', () => {
    const neighbors = getNeighbors(0, 2, 5, 5)
    expect(neighbors).toHaveLength(5)
  })
})

describe('placeMines', () => {
  it('places correct number of mines', () => {
    const board = createEmptyBoard(9, 9)
    const mined = placeMines(board, 10, 0, 0)
    const mineCount = mined.reduce(
      (sum, row) => sum + row.filter(c => c.hasMine).length,
      0
    )
    expect(mineCount).toBe(10)
  })

  it('safe zone (click + neighbors) contains no mines', () => {
    const board = createEmptyBoard(9, 9)
    const mined = placeMines(board, 10, 0, 0)
    expect(mined[0][0].hasMine).toBe(false)
    expect(mined[0][1].hasMine).toBe(false)
    expect(mined[1][0].hasMine).toBe(false)
    expect(mined[1][1].hasMine).toBe(false)
  })

  it('fits maximum mines when limited by safe zone', () => {
    const board = createEmptyBoard(4, 4)
    const mined = placeMines(board, 15, 1, 1)
    const mineCount = mined.reduce(
      (sum, row) => sum + row.filter(c => c.hasMine).length,
      0
    )
    expect(mineCount).toBe(7)
  })

  it('calculates adjacent mine counts', () => {
    const board = createEmptyBoard(5, 5)
    const mined = placeMines(board, 10, 2, 2)
    let hasNonMineWithAdjacent = false
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!mined[r][c].hasMine && mined[r][c].adjacentMines > 0) {
          hasNonMineWithAdjacent = true
        }
      }
    }
    expect(hasNonMineWithAdjacent).toBe(true)
  })
})

describe('revealCell', () => {
  it('reveals a cell', () => {
    const board = createEmptyBoard(5, 5)
    const mined = placeMines(board, 3, 0, 0)
    const revealed = revealCell(mined, 1, 1)
    expect(revealed[1][1].isRevealed).toBe(true)
  })

  it('does nothing if cell is already revealed', () => {
    const board = createEmptyBoard(5, 5)
    const mined = placeMines(board, 3, 0, 0)
    const once = revealCell(mined, 1, 1)
    const twice = revealCell(once, 1, 1)
    expect(twice[1][1].isRevealed).toBe(true)
  })

  it('does nothing if cell is flagged', () => {
    const board = createEmptyBoard(5, 5)
    const flagged = toggleFlag(board, 1, 1)
    const revealed = revealCell(flagged, 1, 1)
    expect(revealed[1][1].isRevealed).toBe(false)
  })

  it('reveals empty region via flood fill', () => {
    const board = createEmptyBoard(5, 5)
    const mined = placeMines(board, 24, 0, 0)
    const revealed = revealCell(mined, 0, 0)
    const revealedCount = revealed.reduce(
      (sum, row) => sum + row.filter(c => c.isRevealed).length,
      0
    )
    expect(revealedCount).toBeGreaterThan(1)
  })
})

describe('toggleFlag', () => {
  it('adds a flag to a cell', () => {
    const board = createEmptyBoard(5, 5)
    const flagged = toggleFlag(board, 2, 3)
    expect(flagged[2][3].isFlagged).toBe(true)
  })

  it('removes a flag from a flagged cell', () => {
    const board = createEmptyBoard(5, 5)
    const flagged = toggleFlag(board, 2, 3)
    const unflagged = toggleFlag(flagged, 2, 3)
    expect(unflagged[2][3].isFlagged).toBe(false)
  })

  it('does nothing on a revealed cell', () => {
    const board = createEmptyBoard(5, 5)
    const revealed = revealCell(board, 1, 1)
    const flagged = toggleFlag(revealed, 1, 1)
    expect(flagged[1][1].isFlagged).toBe(false)
  })
})

describe('chordReveal', () => {
  it('does nothing on an unrevealed cell', () => {
    const board = createEmptyBoard(5, 5)
    const result = chordReveal(board, 2, 2)
    expect(result).toEqual(board.map(r => r.map(c => ({ ...c }))))
  })

  it('does nothing if flag count does not match adjacent mines', () => {
    const board = createEmptyBoard(5, 5)
    const revealed = revealCell(board, 0, 0)
    const result = chordReveal(revealed, 0, 0)
    expect(result[0][0].isRevealed).toBe(true)
  })
})

describe('countFlags', () => {
  it('returns 0 for empty board', () => {
    const board = createEmptyBoard(5, 5)
    expect(countFlags(board)).toBe(0)
  })

  it('returns correct flag count', () => {
    const board = createEmptyBoard(5, 5)
    const flagged = toggleFlag(board, 0, 0)
    const flagged2 = toggleFlag(flagged, 2, 3)
    expect(countFlags(flagged2)).toBe(2)
  })
})

describe('checkWin', () => {
  it('returns false at game start', () => {
    const board = createEmptyBoard(5, 5)
    expect(checkWin(board, 3)).toBe(false)
  })

  it('returns true when all safe cells revealed', () => {
    const board = createEmptyBoard(4, 4)
    const mined = placeMines(board, 1, 3, 3)
    let revealed = revealCell(mined, 0, 0)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!revealed[r][c].isRevealed && !revealed[r][c].hasMine && !revealed[r][c].isFlagged) {
          revealed = revealCell(revealed, r, c)
        }
      }
    }
    expect(checkWin(revealed, 1)).toBe(true)
  })
})

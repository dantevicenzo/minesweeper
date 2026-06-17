import type { Board, Cell, Position } from './types'

const NEIGHBORS: Position[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
]

export function getNeighbors(row: number, col: number, width: number, height: number): Position[] {
  const result: Position[] = []
  for (const n of NEIGHBORS) {
    const r = row + n.row
    const c = col + n.col
    if (r >= 0 && r < height && c >= 0 && c < width) {
      result.push({ row: r, col: c })
    }
  }
  return result
}

function getSafeZone(row: number, col: number, width: number, height: number): Set<string> {
  const zone = new Set<string>()
  zone.add(`${row},${col}`)
  for (const n of getNeighbors(row, col, width, height)) {
    zone.add(`${n.row},${n.col}`)
  }
  return zone
}

function createEmptyCell(): Cell {
  return {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0,
  }
}

export function createEmptyBoard(width: number, height: number): Board {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => createEmptyCell())
  )
}

export function placeMines(
  board: Board,
  mineCount: number,
  safeRow: number,
  safeCol: number
): Board {
  const height = board.length
  const width = board[0].length
  const safeZone = getSafeZone(safeRow, safeCol, width, height)

  const candidates: Position[] = []
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!safeZone.has(`${r},${c}`)) {
        candidates.push({ row: r, col: c })
      }
    }
  }

  const shuffled = [...candidates]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const newBoard = board.map(row => row.map(cell => ({ ...cell })))

  const minesToPlace = Math.min(mineCount, shuffled.length)
  for (let i = 0; i < minesToPlace; i++) {
    const { row, col } = shuffled[i]
    newBoard[row][col] = { ...newBoard[row][col], hasMine: true }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!newBoard[r][c].hasMine) {
        const adjacentMines = getNeighbors(r, c, width, height)
          .filter(n => newBoard[n.row][n.col].hasMine)
          .length
        newBoard[r][c] = { ...newBoard[r][c], adjacentMines }
      }
    }
  }

  return newBoard
}

export function revealCell(board: Board, row: number, col: number): Board {
  const cell = board[row][col]
  if (cell.isRevealed || cell.isFlagged) return board

  const height = board.length
  const width = board[0].length

  const newBoard = board.map(r => r.map(c => ({ ...c })))

  if (cell.hasMine) {
    newBoard[row][col] = { ...newBoard[row][col], isRevealed: true }
    return newBoard
  }

  const queue: Position[] = [{ row, col }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    const key = `${current.row},${current.col}`
    if (visited.has(key)) continue
    visited.add(key)

    const currentCell = newBoard[current.row][current.col]
    if (currentCell.isFlagged) continue

    newBoard[current.row][current.col] = {
      ...currentCell,
      isRevealed: true,
    }

    if (currentCell.adjacentMines === 0 && !currentCell.hasMine) {
      for (const n of getNeighbors(current.row, current.col, width, height)) {
        const nKey = `${n.row},${n.col}`
        if (!visited.has(nKey) && !newBoard[n.row][n.col].isRevealed && !newBoard[n.row][n.col].isFlagged) {
          queue.push(n)
        }
      }
    }
  }

  return newBoard
}

export function toggleFlag(board: Board, row: number, col: number): Board {
  const cell = board[row][col]
  if (cell.isRevealed) return board

  const newBoard = board.map(r => r.map(c => ({ ...c })))
  newBoard[row][col] = { ...newBoard[row][col], isFlagged: !newBoard[row][col].isFlagged }
  return newBoard
}

export function chordReveal(board: Board, row: number, col: number): Board {
  const cell = board[row][col]
  if (!cell.isRevealed || cell.adjacentMines === 0) return board

  const width = board[0].length
  const height = board.length
  const neighbors = getNeighbors(row, col, width, height)
  const flagCount = neighbors.filter(n => board[n.row][n.col].isFlagged).length

  if (flagCount !== cell.adjacentMines) return board

  let newBoard = board.map(r => r.map(c => ({ ...c })))

  for (const n of neighbors) {
    if (!newBoard[n.row][n.col].isRevealed && !newBoard[n.row][n.col].isFlagged) {
      if (newBoard[n.row][n.col].hasMine) {
        newBoard[n.row][n.col] = { ...newBoard[n.row][n.col], isRevealed: true }
      } else {
        newBoard = revealCell(newBoard, n.row, n.col)
      }
    }
  }

  return newBoard
}

export function checkWin(board: Board, mineCount: number): boolean {
  const height = board.length
  const width = board[0].length
  let revealedCount = 0

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (board[r][c].isRevealed) revealedCount++
    }
  }

  const totalSafe = width * height - mineCount
  return revealedCount === totalSafe
}

export function countFlags(board: Board): number {
  return board.reduce(
    (sum, row) => sum + row.filter(c => c.isFlagged).length,
    0
  )
}

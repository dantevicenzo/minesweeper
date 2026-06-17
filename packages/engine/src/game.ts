import type { GameState, GameAction } from './types'
import {
  createEmptyBoard,
  placeMines,
  revealCell,
  toggleFlag,
  chordReveal,
  checkWin,
  countFlags,
} from './board'

export function createGame(width: number, height: number, mineCount: number): GameState {
  return {
    board: createEmptyBoard(width, height),
    status: 'idle',
    width,
    height,
    mineCount,
    flagCount: 0,
    startTime: null,
    elapsedTime: 0,
    minesPlaced: false,
  }
}

export function applyAction(state: GameState, action: GameAction): GameState {
  const { type, row, col } = action

  if (state.status === 'won' || state.status === 'lost') return state

  let newBoard = state.board.map(r => r.map(c => ({ ...c })))
  let newStatus = state.status
  let newMinesPlaced = state.minesPlaced
  let newStartTime = state.startTime

  if (!state.minesPlaced && type === 'reveal') {
    newBoard = placeMines(newBoard, state.mineCount, row, col)
    newMinesPlaced = true
    newStartTime = Date.now()
    newStatus = 'playing'
  }

  switch (type) {
    case 'reveal': {
      newBoard = revealCell(newBoard, row, col)
      const cell = newBoard[row][col]
      if (cell.isRevealed && cell.hasMine) {
        newStatus = 'lost'
        newBoard = revealAllMines(newBoard)
      }
      break
    }
    case 'flag': {
      newBoard = toggleFlag(newBoard, row, col)
      break
    }
    case 'chord': {
      newBoard = chordReveal(newBoard, row, col)
      break
    }
  }

  const newFlagCount = countFlags(newBoard)

  if (newStatus === 'playing' && checkWin(newBoard, state.mineCount)) {
    newStatus = 'won'
  }

  const wasMineHit = type === 'reveal' && newBoard[row][col].hasMine

  const now = state.status !== 'playing' && newStatus === 'playing'
    ? newStartTime
    : state.startTime

  return {
    board: newBoard,
    status: newStatus,
    width: state.width,
    height: state.height,
    mineCount: state.mineCount,
    flagCount: newFlagCount,
    startTime: now,
    elapsedTime: state.elapsedTime,
    minesPlaced: newMinesPlaced,
  }
}

function revealAllMines(board: Board): Board {
  return board.map(row =>
    row.map(cell => {
      if (cell.hasMine) {
        return { ...cell, isRevealed: true }
      }
      return cell
    })
  )
}

export { createEmptyBoard, placeMines, revealCell, toggleFlag, chordReveal, checkWin, countFlags } from './board'
export type { Cell, Board, GameStatus, GameAction, Position } from './types'

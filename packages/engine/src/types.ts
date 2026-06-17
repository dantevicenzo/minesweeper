export interface Cell {
  hasMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

export type Board = Cell[][]

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface GameState {
  board: Board
  status: GameStatus
  width: number
  height: number
  mineCount: number
  flagCount: number
  startTime: number | null
  elapsedTime: number
  minesPlaced: boolean
}

export interface Position {
  row: number
  col: number
}

export interface GameAction {
  type: 'reveal' | 'flag' | 'chord'
  row: number
  col: number
}

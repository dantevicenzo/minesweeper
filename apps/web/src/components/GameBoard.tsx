'use client'

import { useGame } from '@minesweeper/hooks'
import { CellView } from './CellView'

interface GameBoardProps {
  width: number
  height: number
  mineCount: number
}

export function GameBoard({ width, height, mineCount }: GameBoardProps) {
  const { game, dispatch, reset } = useGame(width, height, mineCount)

  return (
    <div>
      <div>
        <span>Mines: {game.mineCount - game.flagCount}</span>
        <span>Status: {game.status}</span>
        <button onClick={reset}>New Game</button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${width}, 32px)`,
          gap: '1px',
        }}
      >
        {game.board.map((row, r) =>
          row.map((cell, c) => (
            <CellView
              key={`${r}-${c}`}
              cell={cell}
              onLeftClick={() => dispatch({ type: 'reveal', row: r, col: c })}
              onRightClick={(e) => {
                e.preventDefault()
                dispatch({ type: 'flag', row: r, col: c })
              }}
              onChordClick={() => dispatch({ type: 'chord', row: r, col: c })}
            />
          ))
        )}
      </div>
    </div>
  )
}

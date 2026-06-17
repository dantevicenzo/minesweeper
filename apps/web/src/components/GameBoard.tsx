'use client'

import { useApiGame } from '../hooks/useApiGame'
import { CellView } from './CellView'
import { useI18n } from '../contexts/I18nContext'

interface GameBoardProps {
  width: number
  height: number
  mineCount: number
  difficulty?: string
}

export function GameBoard({ width, height, mineCount, difficulty = 'easy' }: GameBoardProps) {
  const { t } = useI18n()
  const { game, dispatch, reset } = useApiGame(width, height, mineCount, difficulty)

  return (
    <div>
      <div>
        <span>{t.game.mines}: {game.mineCount - game.flagCount}</span>
        {game.status !== 'idle' && (
          <span> | {t.game.time}: {Math.floor((Date.now() - (game.startTime ?? Date.now())) / 1000)}s</span>
        )}
        <span> | {game.status === 'won' ? t.game.win : game.status === 'lost' ? t.game.lose : ''}</span>
        <button onClick={reset}>{t.game.newGame}</button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${width}, 32px)`,
          gap: '1px',
          marginTop: 8,
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

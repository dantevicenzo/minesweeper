'use client'

import { useApiGame } from '../hooks/useApiGame'
import { CellView } from './CellView'
import { useI18n } from '../contexts/I18nContext'
import styles from './GameBoard.module.css'

interface GameBoardProps {
  width: number
  height: number
  mineCount: number
  difficulty?: string
}

export function GameBoard({ width, height, mineCount, difficulty = 'easy' }: GameBoardProps) {
  const { t } = useI18n()
  const { game, dispatch, reset } = useApiGame(width, height, mineCount, difficulty)

  const statusText =
    game.status === 'won' ? t.game.win
    : game.status === 'lost' ? t.game.lose
    : ''

  const statusClass =
    game.status === 'won' ? styles.win
    : game.status === 'lost' ? styles.lose
    : ''

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>{t.game.mines}: {game.mineCount - game.flagCount}</span>
        {game.status !== 'idle' && (
          <span>
            {t.game.time}: {Math.floor((Date.now() - (game.startTime ?? Date.now())) / 1000)}s
          </span>
        )}
        <span className={`${styles.status} ${statusClass}`}>{statusText}</span>
        <button className={styles.newGameBtn} onClick={reset}>
          {t.game.newGame}
        </button>
      </div>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${width}, 32px)`,
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

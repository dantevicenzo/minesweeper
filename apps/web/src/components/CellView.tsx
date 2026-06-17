'use client'

import type { Cell } from '@minesweeper/engine'
import type { MouseEvent } from 'react'
import styles from './CellView.module.css'

interface CellViewProps {
  cell: Cell
  onLeftClick: () => void
  onRightClick: (e: MouseEvent) => void
  onChordClick: () => void
}

const numberColors: Record<number, string> = {
  1: '#0000ff',
  2: '#008000',
  3: '#ff0000',
  4: '#000080',
  5: '#800000',
  6: '#008080',
  7: '#000000',
  8: '#808080',
}

export function CellView({ cell, onLeftClick, onRightClick, onChordClick }: CellViewProps) {
  const handleClick = () => {
    if (cell.isRevealed && cell.adjacentMines > 0) {
      onChordClick()
    } else {
      onLeftClick()
    }
  }

  let content: string | number = ''
  let color: string | undefined
  let className = styles.cell

  if (cell.isRevealed) {
    className += ` ${styles.revealed}`
    if (cell.hasMine) {
      content = '*'
      className += ` ${styles.mine}`
    } else if (cell.adjacentMines > 0) {
      content = cell.adjacentMines
      color = numberColors[cell.adjacentMines]
    }
  } else if (cell.isFlagged) {
    className += ` ${styles.hidden} ${styles.flagged}`
    content = 'F'
  } else {
    className += ` ${styles.hidden}`
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      onContextMenu={onRightClick}
      style={color ? { color } : undefined}
      aria-label={
        cell.isRevealed
          ? cell.hasMine
            ? 'Mine'
            : `Cell with ${cell.adjacentMines} adjacent mines`
          : cell.isFlagged
            ? 'Flagged'
            : 'Hidden cell'
      }
    >
      {content}
    </button>
  )
}

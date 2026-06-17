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

const numberClass: Record<number, string> = {
  1: styles.n1,
  2: styles.n2,
  3: styles.n3,
  4: styles.n4,
  5: styles.n5,
  6: styles.n6,
  7: styles.n7,
  8: styles.n8,
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
  let className = styles.cell

  if (cell.isRevealed) {
    className += ` ${styles.revealed}`
    if (cell.hasMine) {
      content = '*'
      className += ` ${styles.mine}`
    } else if (cell.adjacentMines > 0) {
      content = cell.adjacentMines
      className += ` ${numberClass[cell.adjacentMines] ?? ''}`
    }
  } else if (cell.isFlagged) {
    className += ` ${styles.hidden} ${styles.flagged}`
    content = 'F'
  } else {
    className += ` ${styles.hidden}`
  }

  return (
    <button
      className={className.trim()}
      onClick={handleClick}
      onContextMenu={onRightClick}
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

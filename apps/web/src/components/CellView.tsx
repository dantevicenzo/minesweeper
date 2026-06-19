'use client'

import type { Cell } from '@minesweeper/engine'
import type { MouseEvent } from 'react'
import styles from './CellView.module.css'

interface CellViewProps {
  cell: Cell
  row: number
  col: number
  gameStatus: string
  isFocused: boolean
  flagMode?: boolean
  onLeftClick: () => void
  onRightClick: (e: MouseEvent) => void
  onChordClick: () => void
  onMouseDown: () => void
  onMouseUp: () => void
  onFocus: () => void
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

export function CellView({ cell, row, col, gameStatus, isFocused, flagMode = false, onLeftClick, onRightClick, onChordClick, onMouseDown, onMouseUp, onFocus }: CellViewProps) {
  const handleClick = () => {
    if (cell.isRevealed && cell.adjacentMines > 0) {
      onChordClick()
    } else if (flagMode && !cell.isRevealed) {
      onRightClick({ preventDefault: () => {} } as MouseEvent)
    } else {
      onLeftClick()
    }
  }

  let content: string | number = ''
  let className = styles.cell

  if (cell.isRevealed) {
    if (cell.hasMine) {
      className += ` ${styles.mine}`
      if (cell.isExploded) {
        className += ` ${styles.mineExploded}`
      }
      content = '●'
    } else {
      className += ` ${styles.revealed}`
      if (cell.adjacentMines > 0) {
        content = cell.adjacentMines
        className += ` ${numberClass[cell.adjacentMines] ?? ''}`
      }
    }
  } else if (cell.isFlagged) {
    className += ` ${styles.hidden} ${styles.flagged}`
    content = '🚩'
  } else {
    className += ` ${styles.hidden}`
  }

  const ariaLabel = cell.isRevealed
    ? cell.hasMine
      ? 'mine'
      : cell.adjacentMines === 0
        ? 'empty'
        : `${cell.adjacentMines}`
    : cell.isFlagged
      ? 'flagged'
      : 'hidden'

  return (
    <button
      className={className.trim()}
      data-row={row}
      data-col={col}
      role="gridcell"
      tabIndex={isFocused ? 0 : -1}
      onClick={handleClick}
      onContextMenu={onRightClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onFocus={onFocus}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  )
}

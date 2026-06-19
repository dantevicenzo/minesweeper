'use client'

import type { Cell } from '@minesweeper/engine'
import type { MouseEvent, ReactNode } from 'react'
import styles from './CellView.module.css'
import { MineIcon, FlagIcon, numberIcons } from './icons'

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

const numberIconRecord: Record<number, typeof numberIcons[1]> = numberIcons

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

  let content: ReactNode = null
  let className = styles.cell

  if (cell.isRevealed) {
    if (cell.hasMine) {
      className += ` ${styles.mine}`
      if (cell.isExploded) {
        className += ` ${styles.mineExploded}`
      }
      content = <MineIcon className={styles.mineIcon} />
    } else {
      className += ` ${styles.revealed}`
      if (cell.adjacentMines > 0) {
        const NumIcon = numberIconRecord[cell.adjacentMines]
        content = <NumIcon className={styles.numberIcon} />
      }
    }
  } else if (cell.isFlagged) {
    className += ` ${styles.hidden} ${styles.flagged}`
    content = <FlagIcon className={styles.flagIcon} />
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

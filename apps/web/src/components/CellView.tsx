'use client'

import type { Cell } from '@minesweeper/engine'
import type { MouseEvent } from 'react'

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
  let bg = '#c0c0c0'
  let color = '#000'

  if (cell.isRevealed) {
    bg = '#e0e0e0'
    if (cell.hasMine) {
      content = '*'
      color = '#000'
    } else if (cell.adjacentMines > 0) {
      content = cell.adjacentMines
      color = numberColors[cell.adjacentMines] ?? '#000'
    }
  } else if (cell.isFlagged) {
    content = 'F'
    color = '#dc2626'
  }

  return (
    <button
      onClick={handleClick}
      onContextMenu={onRightClick}
      style={{
        width: 32,
        height: 32,
        backgroundColor: bg,
        color,
        border: '1px solid #999',
        fontWeight: 700,
        fontSize: 14,
        cursor: cell.isRevealed ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
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

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApiGame } from '../hooks/useApiGame'
import { CellView } from './CellView'
import { useI18n } from '../contexts/I18nContext'
import type { GameState } from '@minesweeper/engine'
import styles from './GameBoard.module.css'

interface GameBoardProps {
  width: number
  height: number
  mineCount: number
  difficulty?: string
  initialState?: Partial<GameState>
}

function formatCounter(n: number): string {
  const clamped = Math.max(-99, Math.min(999, n))
  if (clamped < 0) return '-' + String(Math.abs(clamped)).padStart(2, '0')
  return String(clamped).padStart(3, '0')
}

export function GameBoard({ width, height, mineCount, difficulty = 'easy', initialState }: GameBoardProps) {
  const { t } = useI18n()
  const { game, dispatch, reset } = useApiGame(width, height, mineCount, difficulty, initialState)
  const [time, setTime] = useState(0)
  const [face, setFace] = useState<'🙂' | '😮' | '😎' | '💀'>('🙂')
  const [focusRow, setFocusRow] = useState(0)
  const [focusCol, setFocusCol] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const smileyRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (game.status === 'idle') {
      setTime(0)
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      return
    }

    if (game.status === 'playing' && !timerRef.current && game.startTime) {
      setTime(Math.floor((Date.now() - game.startTime) / 1000))
      timerRef.current = setInterval(() => {
        setTime(prev => Math.min(prev + 1, 999))
      }, 1000)
    }

    if (game.status === 'won' || game.status === 'lost') {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (game.startTime) {
        setTime(Math.floor((Date.now() - game.startTime) / 1000))
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [game.status, game.startTime])

  useEffect(() => {
    if (game.status === 'won') {
      setFace('😎')
      smileyRef.current?.focus()
    } else if (game.status === 'lost') {
      setFace('💀')
      smileyRef.current?.focus()
    } else {
      setFace('🙂')
    }
  }, [game.status])

  const announceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (game.status === 'won' || game.status === 'lost') {
      const msg = game.status === 'won' ? t.game.win : t.game.lose
      if (announceRef.current) {
        announceRef.current.textContent = msg
      }
    }
  }, [game.status, t])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let row = focusRow
    let col = focusCol

    switch (e.key) {
      case 'ArrowUp':
        row = Math.max(0, row - 1)
        e.preventDefault()
        break
      case 'ArrowDown':
        row = Math.min(height - 1, row + 1)
        e.preventDefault()
        break
      case 'ArrowLeft':
        col = Math.max(0, col - 1)
        e.preventDefault()
        break
      case 'ArrowRight':
        col = Math.min(width - 1, col + 1)
        e.preventDefault()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        dispatch({ type: 'reveal', row: focusRow, col: focusCol })
        return
      case 'f':
      case 'F':
        e.preventDefault()
        dispatch({ type: 'flag', row: focusRow, col: focusCol })
        return
      default:
        return
    }

    if (row !== focusRow || col !== focusCol) {
      setFocusRow(row)
      setFocusCol(col)
      const cell = gridRef.current?.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement | null
      cell?.focus()
    }
  }, [focusRow, focusCol, width, height, dispatch])

  const mineDisplay = mineCount - game.flagCount

  return (
    <div className={styles.container} role="region" aria-label={t.game.minesweeperBoard}>
      <div className={styles.header}>
        <div className={styles.counter} role="timer" aria-label={`${t.game.mines}: ${mineDisplay}`}>
          {formatCounter(mineDisplay)}
        </div>
        <button
          ref={smileyRef}
          className={styles.smiley}
          onClick={reset}
          aria-label={t.game.newGame}
        >
          {face}
        </button>
        <div className={styles.counter} role="timer" aria-label={`${t.game.time}: ${time}s`}>
          {formatCounter(time)}
        </div>
      </div>
      <div
        ref={gridRef}
        className={styles.grid}
        role="grid"
        aria-label={t.game.boardLabel}
        onKeyDown={handleKeyDown}
        style={{
          gridTemplateColumns: `repeat(${width}, 28px)`,
        }}
      >
        {game.board.map((row, r) =>
          row.map((cell, c) => (
            <CellView
              key={`${r}-${c}`}
              cell={cell}
              row={r}
              col={c}
              gameStatus={game.status}
              isFocused={r === focusRow && c === focusCol}
              onLeftClick={() => dispatch({ type: 'reveal', row: r, col: c })}
              onRightClick={(e) => {
                e.preventDefault()
                dispatch({ type: 'flag', row: r, col: c })
              }}
              onChordClick={() => dispatch({ type: 'chord', row: r, col: c })}
              onMouseDown={() => setFace('😮')}
              onMouseUp={() => { if (game.status === 'idle' || game.status === 'playing') setFace('🙂') }}
              onFocus={() => { setFocusRow(r); setFocusCol(c) }}
            />
          ))
        )}
      </div>
      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      />
    </div>
  )
}

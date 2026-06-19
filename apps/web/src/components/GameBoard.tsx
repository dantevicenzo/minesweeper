'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApiGame } from '../hooks/useApiGame'
import { CellView } from './CellView'
import { ResultModal } from './ResultModal'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import type { GameAction, GameState } from '@minesweeper/engine'
import styles from './GameBoard.module.css'

interface GameBoardProps {
  width: number
  height: number
  mineCount: number
  difficulty?: string
  initialState?: Partial<GameState>
  flagMode?: boolean
  onFlagModeChange?: (mode: boolean) => void
  onOpenMenu?: () => void
}

function formatCounter(n: number): string {
  const clamped = Math.max(-99, Math.min(999, n))
  if (clamped < 0) return '-' + String(Math.abs(clamped)).padStart(2, '0')
  return String(clamped).padStart(3, '0')
}

const CELL = 28
const PAD = 10
const BORDER = 3
const HEADER_H = 42
const GRID_BORDER = 3

function naturalWidth(cols: number): number {
  return cols * CELL + 2 * PAD + 2 * BORDER + 2 * GRID_BORDER
}

function naturalHeight(rows: number): number {
  return HEADER_H + rows * CELL + 2 * PAD + 2 * BORDER + 2 * GRID_BORDER
}

const WRAPPER_PADDING = 16

function calcScale(cols: number, rows: number, availW: number, availH: number): number {
  const w = availW - WRAPPER_PADDING
  const h = availH - WRAPPER_PADDING
  if (w <= 0 || h <= 0) return 0.3
  const s = Math.min(w / naturalWidth(cols), h / naturalHeight(rows))
  return Math.max(0.3, Math.min(2, s))
}

export function GameBoard({ width, height, mineCount, difficulty = 'easy', initialState, flagMode = false, onFlagModeChange, onOpenMenu }: GameBoardProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { game, dispatch, reset } = useApiGame(width, height, mineCount, difficulty, initialState)
  const { user } = useAuth()
  const clickCountRef = useRef(0)
  const [showResult, setShowResult] = useState(false)
  const [time, setTime] = useState(0)
  const [face, setFace] = useState<'🙂' | '😮' | '😎' | '💀'>('🙂')
  const [focusRow, setFocusRow] = useState(0)
  const [focusCol, setFocusCol] = useState(0)
  const [scale, setScale] = useState(1)
  const scaledW = naturalWidth(width) * scale
  const scaledH = naturalHeight(height) * scale
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const smileyRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      setScale(calcScale(width, height, el.clientWidth, el.clientHeight))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height])

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

  useEffect(() => {
    if (game.status === 'won' || game.status === 'lost') {
      setShowResult(true)
    } else {
      setShowResult(false)
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

  const wrappedDispatch = useCallback((action: GameAction) => {
    clickCountRef.current += 1
    dispatch(action)
  }, [dispatch])

  const wrappedReset = useCallback(() => {
    setShowResult(false)
    clickCountRef.current = 0
    reset()
  }, [reset])

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
        wrappedDispatch({ type: 'reveal', row: focusRow, col: focusCol })
        return
      case 'f':
      case 'F':
        e.preventDefault()
        wrappedDispatch({ type: 'flag', row: focusRow, col: focusCol })
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
  }, [focusRow, focusCol, width, height, wrappedDispatch])

  const mineDisplay = mineCount - game.flagCount
  const xpMap: Record<string, number> = { easy: 100, medium: 150, hard: 200 }
  const xpEarned = user && game.status === 'won' ? (xpMap[difficulty] ?? 100) : undefined

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
    <div className={styles.scaler} style={{ width: scaledW, height: scaledH }}>
    <div
      className={styles.container}
      ref={containerRef}
      role="region"
      aria-label={t.game.minesweeperBoard}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={`${styles.headerBtn} ${flagMode ? styles.flagActive : ''}`}
            onClick={() => onFlagModeChange?.(!flagMode)}
            aria-label="Toggle flag mode"
            aria-pressed={flagMode}
          >
            🚩
          </button>
          <button
            className={styles.headerBtn}
            onClick={() => router.push('/leaderboard')}
            aria-label={t.home.leaderboard}
          >
            🏆
          </button>
        </div>
        <div className={styles.headerCenter}>
          <div className={styles.counter} role="timer" aria-label={`${t.game.mines}: ${mineDisplay}`}>
            {formatCounter(mineDisplay)}
          </div>
          <button
            ref={smileyRef}
            className={styles.smiley}
            onClick={wrappedReset}
            aria-label={t.game.newGame}
          >
            {face}
          </button>
          <div className={styles.counter} role="timer" aria-label={`${t.game.time}: ${time}s`}>
            {formatCounter(time)}
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.headerBtn}
            onClick={() => router.push('/profile')}
            aria-label={t.home.profile}
          >
            👤
          </button>
          <button
            className={styles.headerBtn}
            onClick={onOpenMenu}
            aria-label={t.home.settings}
          >
            ⚙️
          </button>
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
              flagMode={flagMode}
              onLeftClick={() => wrappedDispatch({ type: 'reveal', row: r, col: c })}
              onRightClick={(e) => {
                e.preventDefault()
                wrappedDispatch({ type: 'flag', row: r, col: c })
              }}
              onChordClick={() => wrappedDispatch({ type: 'chord', row: r, col: c })}
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
    </div>
    {showResult && (
      <ResultModal
        status={game.status as 'won' | 'lost'}
        time={time}
        difficulty={difficulty}
        mineCount={mineCount}
        flagCount={game.flagCount}
        clickCount={clickCountRef.current}
        width={width}
        height={height}
        xpEarned={xpEarned}
        onPlayAgain={wrappedReset}
      />
    )}
    </div>
  )
}

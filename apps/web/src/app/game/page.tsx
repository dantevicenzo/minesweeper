'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { loadSavedGame, clearSavedGame } from '../../lib/storage'
import { useI18n } from '../../contexts/I18nContext'
import type { GameState } from '@minesweeper/engine'
import styles from './page.module.css'

const GameBoard = dynamic(() => import('../../components/GameBoard').then(m => m.GameBoard), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading game...</div>,
})

const DIFFICULTIES = [
  { key: 'easy', label: 'easy', width: 9, height: 9, mines: 10 },
  { key: 'medium', label: 'medium', width: 16, height: 16, mines: 40 },
  { key: 'hard', label: 'hard', width: 30, height: 16, mines: 99 },
] as const

const CUSTOM_KEY = 'custom'
const MIN_SIZE = 5
const MAX_SIZE = 100

type DifficultyPreset = typeof DIFFICULTIES[number]

function GameContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const isContinue = searchParams.get('continue') === '1'
  const isCustomParam = searchParams.get('custom') === '1'

  const [difficulty, setDifficulty] = useState<DifficultyPreset>(DIFFICULTIES[0])
  const [isCustom, setIsCustom] = useState(false)
  const [customWidth, setCustomWidth] = useState(12)
  const [customHeight, setCustomHeight] = useState(12)
  const [customMines, setCustomMines] = useState(20)
  const [initialState, setInitialState] = useState<Partial<GameState> | undefined>(undefined)

  const maxMines = customWidth * customHeight - 1

  useEffect(() => {
    if (isCustomParam) {
      setIsCustom(true)
      return
    }

    if (isContinue) {
      const saved = loadSavedGame()
      if (saved) {
        const diff = DIFFICULTIES.find(d => d.key === saved.difficulty)
        if (diff) {
          setDifficulty(diff)
          setIsCustom(false)
        } else if (saved.difficulty === CUSTOM_KEY) {
          setDifficulty(DIFFICULTIES[0])
          setIsCustom(true)
          setCustomWidth(saved.width ?? 12)
          setCustomHeight(saved.height ?? 12)
          setCustomMines(saved.mineCount ?? 20)
        }
        setInitialState(saved.state as Partial<GameState>)
        clearSavedGame()
      }
    }
  }, [isContinue, isCustomParam])

  const handleDifficultyChange = useCallback((key: string) => {
    if (key === CUSTOM_KEY) {
      setIsCustom(true)
      return
    }
    const diff = DIFFICULTIES.find(d => d.key === key)
    if (diff) {
      setDifficulty(diff)
      setIsCustom(false)
    }
  }, [])

  const boardWidth = isCustom ? customWidth : difficulty.width
  const boardHeight = isCustom ? customHeight : difficulty.height
  const boardMines = isCustom ? customMines : difficulty.mines
  const difficultyLabel = isCustom ? CUSTOM_KEY : difficulty.key

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      {!isContinue && (
        <div className={styles.difficultySection}>
          <label>{t.leaderboard.difficulty}</label>
          <select
            className={styles.select}
            value={isCustom ? CUSTOM_KEY : difficulty.key}
            onChange={e => handleDifficultyChange(e.target.value)}
          >
            {DIFFICULTIES.map(d => (
              <option key={d.key} value={d.key}>
                {t.game.difficulty[d.label as keyof typeof t.game.difficulty]}
              </option>
            ))}
            <option value={CUSTOM_KEY}>
              {t.game.difficulty.custom}
            </option>
          </select>

          {isCustom && (
            <div className={styles.customInputs}>
              <label>
                {t.game.customWidth}
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={customWidth}
                  onChange={e => setCustomWidth(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(e.target.value) || MIN_SIZE)))}
                  className={styles.numberInput}
                />
              </label>
              <label>
                {t.game.customHeight}
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={customHeight}
                  onChange={e => setCustomHeight(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(e.target.value) || MIN_SIZE)))}
                  className={styles.numberInput}
                />
              </label>
              <label>
                {t.game.customMines}
                <input
                  type="number"
                  min={1}
                  max={maxMines}
                  value={customMines}
                  onChange={e => setCustomMines(Math.max(1, Math.min(maxMines, Number(e.target.value) || 1)))}
                  className={styles.numberInput}
                />
              </label>
            </div>
          )}
        </div>
      )}
      <div className={styles.gameArea}>
        <GameBoard
          key={isContinue ? 'continue' : `${difficultyLabel}-${boardWidth}x${boardHeight}-${boardMines}`}
          width={boardWidth}
          height={boardHeight}
          mineCount={boardMines}
          difficulty={difficultyLabel}
          initialState={initialState}
        />
      </div>
    </main>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={null}>
      <GameContent />
    </Suspense>
  )
}

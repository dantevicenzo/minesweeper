'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GameBoard } from '../../components/GameBoard'
import { loadSavedGame, clearSavedGame } from '../../lib/storage'
import { useI18n } from '../../contexts/I18nContext'
import type { GameState } from '@minesweeper/engine'
import styles from '../page.module.css'

const DIFFICULTIES = [
  { key: 'easy', label: 'easy', width: 9, height: 9, mines: 10 },
  { key: 'medium', label: 'medium', width: 16, height: 16, mines: 40 },
  { key: 'hard', label: 'hard', width: 30, height: 16, mines: 99 },
] as const

function GameContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const isContinue = searchParams.get('continue') === '1'

  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]>(DIFFICULTIES[0])
  const [initialState, setInitialState] = useState<Partial<GameState> | undefined>(undefined)

  useEffect(() => {
    if (isContinue) {
      const saved = loadSavedGame()
      if (saved) {
        const diff = DIFFICULTIES.find(d => d.key === saved.difficulty)
        if (diff) setDifficulty(diff)
        setInitialState(saved.state as Partial<GameState>)
        clearSavedGame()
      }
    }
  }, [isContinue])

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      {!isContinue && (
        <div>
          <label>{t.leaderboard.difficulty}</label>
          <select
            className={styles.select}
            value={difficulty.key}
            onChange={e => {
              const diff = DIFFICULTIES.find(d => d.key === e.target.value)
              if (diff) setDifficulty(diff)
            }}
          >
            {DIFFICULTIES.map(d => (
              <option key={d.key} value={d.key}>
                {t.game.difficulty[d.label as keyof typeof t.game.difficulty]}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={styles.gameArea}>
        <GameBoard
          key={isContinue ? 'continue' : difficulty.key}
          width={difficulty.width}
          height={difficulty.height}
          mineCount={difficulty.mines}
          difficulty={difficulty.key}
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

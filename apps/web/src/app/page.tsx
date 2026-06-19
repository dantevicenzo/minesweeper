'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { BottomSheet } from '../components/BottomSheet'
import { GameMenu } from '../components/GameMenu'
import { useI18n } from '../contexts/I18nContext'
import type { GameState } from '@minesweeper/engine'
import styles from './page.module.css'

const GameBoard = lazy(() => import('../components/GameBoard').then(m => ({ default: m.GameBoard })))

export default function HomePage() {
  const { t } = useI18n()
  const [difficulty, setDifficulty] = useState('easy')
  const [width, setWidth] = useState(9)
  const [height, setHeight] = useState(9)
  const [mineCount, setMineCount] = useState(10)
  const [initialState, setInitialState] = useState<Partial<GameState> | undefined>(undefined)
  const [gameKey, setGameKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [flagMode, setFlagMode] = useState(false)

  const startGame = useCallback((diff: string, w?: number, h?: number, mines?: number) => {
    setDifficulty(diff)
    setWidth(w ?? 9)
    setHeight(h ?? 9)
    setMineCount(mines ?? 10)
    setInitialState(undefined)
    setGameKey(k => k + 1)
  }, [])

  const handleNewGame = useCallback(() => {
    setInitialState(undefined)
    setGameKey(k => k + 1)
  }, [])

  return (
    <div className={styles.page}>
      <Suspense fallback={<div className={styles.loading}>Loading game...</div>}>
        <GameBoard
          key={gameKey}
          width={width}
          height={height}
          mineCount={mineCount}
          difficulty={difficulty}
          initialState={initialState}
          flagMode={flagMode}
          onFlagModeChange={setFlagMode}
          onOpenMenu={() => setMenuOpen(true)}
        />
      </Suspense>

      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title={t.home.settings}>
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onStartGame={startGame}
          onNewGame={handleNewGame}
          currentDifficulty={difficulty}
        />
      </BottomSheet>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useTheme } from '../contexts/ThemeContext'
import styles from './GameMenu.module.css'
import type { Locale } from '../lib/i18n'

interface GameMenuProps {
  onClose: () => void
  onStartGame: (difficulty: string, width?: number, height?: number, mineCount?: number) => void
  onNewGame: () => void
  currentDifficulty?: string
}

const DIFFICULTIES = [
  { key: 'easy', labelKey: 'easy', width: 9, height: 9, mines: 10 },
  { key: 'medium', labelKey: 'medium', width: 16, height: 16, mines: 40 },
  { key: 'hard', labelKey: 'hard', width: 30, height: 16, mines: 99 },
] as const

export function GameMenu({ onClose, onStartGame, onNewGame, currentDifficulty = 'easy' }: GameMenuProps) {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [difficulty, setDifficulty] = useState(currentDifficulty)
  const [customWidth, setCustomWidth] = useState(12)
  const [customHeight, setCustomHeight] = useState(12)
  const [customMines, setCustomMines] = useState(20)

  const diffLabel = (key: string) => {
    switch (key) {
      case 'easy': return t.game.difficulty.easy
      case 'medium': return t.game.difficulty.medium
      case 'hard': return t.game.difficulty.hard
      default: return key
    }
  }

  const handleDifficulty = (key: string) => {
    setDifficulty(key)
    if (key === 'custom') return
    const diff = DIFFICULTIES.find(d => d.key === key)!
    onStartGame(key, diff.width, diff.height, diff.mines)
    onClose()
  }

  const handleCustomStart = () => {
    onStartGame('custom', customWidth, customHeight, customMines)
    onClose()
  }

  return (
    <div className={styles.menu}>
      <button className={styles.menuBtn} onClick={() => { onNewGame(); onClose() }}>
        {t.home.newGame}
      </button>

      <div className={styles.selectRow}>
        <label>{t.leaderboard.difficulty}</label>
        <select
          value={difficulty}
          onChange={e => {
            const val = e.target.value
            if (val === 'custom') {
              setDifficulty('custom')
            } else {
              handleDifficulty(val)
            }
          }}
        >
          {DIFFICULTIES.map(d => (
            <option key={d.key} value={d.key}>{diffLabel(d.key)}</option>
          ))}
          <option value="custom">{t.game.difficulty.custom}</option>
        </select>
      </div>

      {difficulty === 'custom' && (
        <div className={styles.customInputs}>
          <label>
            {t.game.customWidth}
            <input type="number" min={5} max={100} value={customWidth}
              onChange={e => setCustomWidth(Number(e.target.value))} />
          </label>
          <label>
            {t.game.customHeight}
            <input type="number" min={5} max={100} value={customHeight}
              onChange={e => setCustomHeight(Number(e.target.value))} />
          </label>
          <label>
            {t.game.customMines}
            <input type="number" min={1} max={customWidth * customHeight - 1} value={customMines}
              onChange={e => setCustomMines(Number(e.target.value))} />
          </label>
          <button className={styles.customStartBtn} onClick={handleCustomStart}>▶</button>
        </div>
      )}

      <div className={styles.selectRow}>
        <label>{t.settings.language}</label>
        <select value={locale} onChange={e => setLocale(e.target.value as Locale)}>
          <option value="en">English</option>
          <option value="pt-BR">Português</option>
        </select>
      </div>

      <div className={styles.selectRow}>
        <label>{t.settings.theme}</label>
        <select value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark')}>
          <option value="light">{t.settings.light}</option>
          <option value="dark">{t.settings.dark}</option>
        </select>
      </div>

      {user && (
        <button className={`${styles.menuBtn} ${styles.signOutRow}`} onClick={() => { signOut(); onClose() }}>
          {t.auth.signOut}
        </button>
      )}

      <a
        className={`${styles.menuBtn} ${styles.donateBtn}`}
        href="https://buymeacoffee.com/dantevicenzo"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t.home.donate}
      </a>

      <div className={styles.credits}>
        <span className={styles.creditsText}>
          {t.credits.developedBy} Dante Vicenzo · {t.credits.year}
        </span>
        <div className={styles.creditsLinks}>
          <a href="https://github.com/dantevicenzo" target="_blank" rel="noopener noreferrer" aria-label="GitHub">GitHub</a>
          <a href="https://linkedin.com/in/dantevicenzo" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
        </div>
      </div>
    </div>
  )
}

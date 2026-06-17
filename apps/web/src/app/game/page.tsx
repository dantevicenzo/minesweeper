'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GameBoard } from '../../components/GameBoard'
import { useI18n } from '../../contexts/I18nContext'
import styles from '../page.module.css'

const DIFFICULTIES = [
  { key: 'easy', label: 'easy', width: 9, height: 9, mines: 10 },
  { key: 'medium', label: 'medium', width: 16, height: 16, mines: 40 },
  { key: 'hard', label: 'hard', width: 30, height: 16, mines: 99 },
] as const

export default function GamePage() {
  const { t } = useI18n()
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]>(DIFFICULTIES[0])

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <div>
        <label>{t.leaderboard.difficulty}</label>
        <select
          className={styles.select}
          style={{ marginLeft: 8 }}
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
      <div style={{ marginTop: 16 }}>
        <GameBoard
          key={difficulty.key}
          width={difficulty.width}
          height={difficulty.height}
          mineCount={difficulty.mines}
          difficulty={difficulty.key}
        />
      </div>
    </main>
  )
}

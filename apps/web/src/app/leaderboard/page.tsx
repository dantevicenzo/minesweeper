'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { useI18n } from '../../contexts/I18nContext'
import styles from '../page.module.css'

interface Entry {
  id: string
  duration_ms: number
  difficulty: string
  created_at: string
  profiles: { display_name: string; avatar_url: string | null }
}

export default function LeaderboardPage() {
  const { t } = useI18n()
  const [entries, setEntries] = useState<Entry[]>([])
  const [difficulty, setDifficulty] = useState('easy')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.leaderboard.list(difficulty)
      .then(data => setEntries((data as { data: Entry[] }).data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [difficulty])

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{t.leaderboard.title}</h1>
      <div>
        <label>{t.leaderboard.difficulty}</label>
        <select
          className={styles.select}
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : entries.length === 0 ? (
        <p className={styles.empty}>{t.leaderboard.noEntries}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t.leaderboard.rank}</th>
              <th>{t.leaderboard.player}</th>
              <th>{t.leaderboard.time}</th>
              <th>{t.leaderboard.date}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={entry.id}>
                <td>{i + 1}</td>
                <td>{entry.profiles.display_name}</td>
                <td>{(entry.duration_ms / 1000).toFixed(1)}s</td>
                <td>{new Date(entry.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

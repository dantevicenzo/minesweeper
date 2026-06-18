'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import styles from './page.module.css'

interface Entry {
  id: string
  duration_ms: number
  difficulty: string
  created_at: string
  display_name: string
  avatar_url: string | null
  rank?: number
}

interface MyEntry {
  id: string
  duration_ms: number
  rank: number
  display_name: string
}

const PERIODS = ['all', 'today', 'week', 'month'] as const

export default function LeaderboardPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [difficulty, setDifficulty] = useState('easy')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [myEntry, setMyEntry] = useState<MyEntry | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)

    Promise.all([
      api.leaderboard.list(difficulty, 1, 50, period)
        .then(data => setEntries((data as { data: Entry[] }).data)),
      user
        ? api.leaderboard.me(difficulty, period)
            .then(d => setMyEntry(d as MyEntry))
            .catch(() => setMyEntry(null))
        : Promise.resolve(),
    ])
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [difficulty, period, user])

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{t.leaderboard.title}</h1>

      <div className={styles.filters}>
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

        <div>
          <label>{t.leaderboard.period ?? 'Period'}</label>
          <select
            className={styles.select}
            value={period}
            onChange={e => setPeriod(e.target.value as typeof period)}
          >
            <option value="all">{t.leaderboard.allTime ?? 'All Time'}</option>
            <option value="today">{t.leaderboard.today ?? 'Today'}</option>
            <option value="week">{t.leaderboard.week ?? 'This Week'}</option>
            <option value="month">{t.leaderboard.month ?? 'This Month'}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className={styles.status}>Loading...</p>
      ) : error ? (
        <p className={styles.status}>Failed to load leaderboard</p>
      ) : entries.length === 0 ? (
        <p className={styles.status}>{t.leaderboard.noEntries}</p>
      ) : (
        <>
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
              {entries.map((entry, i) => {
                const isMe = user && entry.display_name && myEntry?.display_name === entry.display_name
                return (
                  <tr key={entry.id} className={isMe ? styles.myRow : undefined}>
                    <td>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td>{entry.display_name}</td>
                    <td>{(entry.duration_ms / 1000).toFixed(1)}s</td>
                    <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {myEntry && !entries.some(e => e.id === myEntry.id) && (
            <div className={styles.myPosition}>
              <p>
                {t.leaderboard.yourPosition ?? 'Your position'}: #{myEntry.rank}
                {' — '}
                {(myEntry.duration_ms / 1000).toFixed(1)}s
              </p>
            </div>
          )}
        </>
      )}
    </main>
  )
}

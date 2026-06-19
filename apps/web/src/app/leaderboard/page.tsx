'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import styles from './page.module.css'

interface Entry {
  id: string
  user_id: string
  duration_ms: number
  difficulty: string
  created_at: string
  display_name: string
  avatar_url: string | null
  rank?: number
  width?: number
  height?: number
  mine_count?: number
}

interface MyEntry {
  id: string
  duration_ms: number
  rank: number
  display_name: string
}

const PERIODS = ['all', 'today', 'week', 'month'] as const
const MIN_SIZE = 5
const MAX_SIZE = 100

const DIFFICULTY_OPTIONS = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'custom', label: 'Custom' },
] as const

export default function LeaderboardPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [difficulty, setDifficulty] = useState('easy')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [myEntry, setMyEntry] = useState<MyEntry | null>(null)

  const [customWidth, setCustomWidth] = useState(12)
  const [customHeight, setCustomHeight] = useState(12)
  const [customMines, setCustomMines] = useState(20)
  const maxMines = customWidth * customHeight - 1

  const isCustom = difficulty === 'custom'

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(false)
    setMyEntry(null)

    const customConfig = isCustom
      ? { width: customWidth, height: customHeight, mineCount: customMines }
      : undefined

    try {
      const [listData, myData] = await Promise.all([
        api.leaderboard.list(difficulty, 1, 50, period, customConfig),
        user
          ? api.leaderboard.me(difficulty, period, customConfig).catch(() => null)
          : Promise.resolve(null),
      ])

      setEntries((listData as { data: Entry[] }).data)
      if (myData) setMyEntry(myData as MyEntry)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [difficulty, period, user, isCustom, customWidth, customHeight, customMines])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const label = (key: string) => {
    switch (key) {
      case 'easy': return t.game.difficulty.easy
      case 'medium': return t.game.difficulty.medium
      case 'hard': return t.game.difficulty.hard
      case 'custom': return t.game.difficulty.custom
      default: return key
    }
  }

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
            {DIFFICULTY_OPTIONS.map(d => (
              <option key={d.key} value={d.key}>{label(d.key)}</option>
            ))}
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

      {isCustom && (
        <div className={styles.customInputs}>
          <label>
            Width
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
            Height
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
            Mines
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

      {loading ? (
        <p className={styles.status}>Loading...</p>
      ) : error ? (
        <p className={styles.status}>Failed to load leaderboard</p>
      ) : entries.length === 0 ? (
        <p className={styles.status}>{t.leaderboard.noEntries}</p>
      ) : (
        <>
          <div className={styles.boardInfo}>
            {entries[0]?.width && entries[0]?.height && entries[0]?.mine_count ? (
              <span>{entries[0].width} × {entries[0].height} · {entries[0].mine_count} mines</span>
            ) : isCustom ? (
              <span>{customWidth} × {customHeight} · {customMines} mines</span>
            ) : null}
          </div>

          <div className={styles.tableWrapper}>
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
                    <td>
                      <Link href={`/profile/${entry.user_id}`} className={styles.playerLink}>
                        {entry.display_name}
                      </Link>
                    </td>
                    <td>{(entry.duration_ms / 1000).toFixed(1)}s</td>
                    <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>

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

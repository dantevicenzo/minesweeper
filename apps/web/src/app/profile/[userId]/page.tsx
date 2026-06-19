'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { useI18n } from '../../../contexts/I18nContext'
import { api } from '../../../lib/api'
import styles from '../page.module.css'

interface ProfileData {
  profile: { xp: number; level: number; username: string; full_name: string | null; avatar_url: string | null }
  games: { total_games: number; wins: number; losses: number; avg_win_time_ms: number; best_time_ms: number }
}

interface Achievement {
  id: string
  key: string
  name_key: string
  description_key: string
  icon: string
  unlocked: boolean
  unlockedAt: string | null
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const { t } = useI18n()
  const [data, setData] = useState<ProfileData | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    api.stats.get(userId)
      .then(d => setData(d as ProfileData))
      .catch(err => setError(err.message))

    api.achievements.get(userId)
      .then(d => setAchievements(d as Achievement[]))
      .catch(err => console.error('[PublicProfile] Failed to load achievements:', err))
  }, [userId])

  if (error) {
    return (
      <main className={styles.page}>
        <Link href="/" className={styles.backLink}>{'< Back'}</Link>
        <p className={styles.loading}>{error}</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className={styles.page}>
        <Link href="/" className={styles.backLink}>{'< Back'}</Link>
        <p className={styles.loading}>Loading...</p>
      </main>
    )
  }

  const { profile, games } = data
  const winRate = games.total_games > 0
    ? Math.round((games.wins / games.total_games) * 100)
    : 0

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{profile.username}</h1>
      {profile.full_name && <p className={styles.emailLabel}>{profile.full_name}</p>}

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{profile.level}</div>
          <div className={styles.statLabel}>{t.profile.level}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{profile.xp}</div>
          <div className={styles.statLabel}>{t.profile.xp}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{games.total_games}</div>
          <div className={styles.statLabel}>{t.profile.gamesPlayed}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{winRate}%</div>
          <div className={styles.statLabel}>{t.profile.winRate}</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>{t.profile.achievements}</h2>
      <div className={styles.achievementGrid}>
        {achievements.map(a => (
          <div key={a.id} className={`${styles.achievement} ${a.unlocked ? styles.achievementUnlocked : styles.achievementLocked}`}>
            <span className={styles.achievementIcon}>{a.unlocked ? '🏆' : '🔒'}</span>
            <span className={styles.achievementName}>{t.achievements?.[a.key as keyof typeof t.achievements]?.name ?? a.key}</span>
          </div>
        ))}
      </div>
      <p className={styles.achievementCount}>
        {achievements.filter(a => a.unlocked).length}/{achievements.length} {t.profile.unlocked}
      </p>
    </main>
  )
}

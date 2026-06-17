'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'

interface ProfileData {
  profile: { xp: number; level: number; display_name: string; avatar_url: string | null }
  games: { total_games: number; wins: number; losses: number; avg_win_time_ms: number; best_time_ms: number }
}

export default function ProfilePage() {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    api.stats.me().then(d => setData(d as ProfileData)).catch(() => {})
  }, [user, router])

  if (!user || !data) return null

  const { profile, games } = data
  const winRate = games.total_games > 0
    ? Math.round((games.wins / games.total_games) * 100)
    : 0

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{t.profile.title}</h1>
      <p style={{ color: 'var(--color-text-secondary, #666)', marginBottom: 16 }}>{user.email}</p>
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
      <h2 style={{ marginTop: 24, fontSize: 18 }}>{t.profile.achievements}</h2>
      <button
        className={styles.submitBtn}
        style={{ marginTop: 24, background: 'var(--color-text-secondary, #666)' }}
        onClick={() => signOut()}
      >
        {t.auth.signOut}
      </button>
    </main>
  )
}

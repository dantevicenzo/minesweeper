'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'
import styles from '../page.module.css'

export default function ProfilePage() {
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<{
    total: number
    won: number
    lost: number
    winRate: number
    bestTimes: Record<string, number | null>
    xp: number
    level: number
  } | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    api.stats.me().then(data => setStats(data as typeof stats)).catch(() => {})
  }, [user, router])

  if (!user || !stats) return null

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{t.profile.title}</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>{user.email}</p>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.level}</div>
          <div className={styles.statLabel}>{t.profile.level}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.xp}</div>
          <div className={styles.statLabel}>{t.profile.xp}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>{t.profile.gamesPlayed}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.winRate}%</div>
          <div className={styles.statLabel}>{t.profile.winRate}</div>
        </div>
      </div>
      <h2 style={{ marginTop: 24, fontSize: 18 }}>{t.profile.achievements}</h2>
      <button
        className={styles.submitBtn}
        style={{ marginTop: 24, background: '#666' }}
        onClick={() => signOut()}
      >
        {t.auth.signOut}
      </button>
    </main>
  )
}

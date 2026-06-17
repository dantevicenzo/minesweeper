'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'

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
    api.stats.me().then((data) => setStats(data as typeof stats)).catch(() => {})
  }, [user, router])

  if (!user || !stats) return null

  return (
    <main>
      <h1>{t.profile.title}</h1>
      <p>{user.email}</p>
      <p>{t.profile.level} {stats.level} | {t.profile.xp} {stats.xp}</p>
      <h2>{t.profile.stats}</h2>
      <p>{t.profile.gamesPlayed}: {stats.total}</p>
      <p>{t.profile.won}: {stats.won}</p>
      <p>{t.profile.lost}: {stats.lost}</p>
      <p>{t.profile.winRate}: {stats.winRate}%</p>
      <h2>{t.profile.achievements}</h2>
      <button onClick={() => signOut()}>{t.auth.signOut}</button>
    </main>
  )
}

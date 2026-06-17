'use client'

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { loadSavedGame } from '../lib/storage'
import styles from './page.module.css'

export default function HomePage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [saved, setSaved] = useState<{ difficulty: string; width: number; height: number; mineCount: number } | null>(null)

  useEffect(() => {
    const data = loadSavedGame()
    if (data) {
      setSaved({ difficulty: data.difficulty, width: data.width, height: data.height, mineCount: data.mineCount })
    }
  }, [])

  const continueUrl = saved
    ? `/game?continue=1&width=${saved.width}&height=${saved.height}&mineCount=${saved.mineCount}&difficulty=${saved.difficulty}`
    : null

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{t.home.title}</h1>
      <nav className={styles.nav}>
        {continueUrl && (
          <Link href={continueUrl} className={`${styles.navBtn} ${styles.continueBtn}`}>
            {t.home.continue}
          </Link>
        )}
        <Link href="/game" className={styles.navBtn}>
          {t.home.newGame}
        </Link>
        <Link href="/leaderboard" className={styles.navBtn}>
          {t.home.leaderboard}
        </Link>
        <Link href="/profile" className={styles.navBtn}>
          {t.home.profile}
        </Link>
        <Link href="/settings" className={styles.navBtn}>
          {t.home.settings}
        </Link>
      </nav>
      {!user && (
        <Link href="/auth" className={`${styles.navBtn} ${styles.authBtn}`}>
          {t.auth.signIn}
        </Link>
      )}
    </main>
  )
}

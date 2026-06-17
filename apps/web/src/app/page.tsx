'use client'

import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import styles from './page.module.css'

export default function HomePage() {
  const { t } = useI18n()
  const { user } = useAuth()

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{t.home.title}</h1>
      <nav className={styles.nav}>
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

'use client'

import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'

export default function HomePage() {
  const { t } = useI18n()
  const { user } = useAuth()

  return (
    <main>
      <h1>{t.home.title}</h1>
      <nav>
        <Link href="/game">
          <button>{t.home.newGame}</button>
        </Link>
        <Link href="/leaderboard">
          <button>{t.home.leaderboard}</button>
        </Link>
        <Link href="/profile">
          <button>{t.home.profile}</button>
        </Link>
        <Link href="/settings">
          <button>{t.home.settings}</button>
        </Link>
      </nav>
      {!user && (
        <Link href="/auth">
          <button>{t.auth.signIn}</button>
        </Link>
      )}
    </main>
  )
}

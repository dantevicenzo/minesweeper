'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import styles from '../page.module.css'

export default function AuthPage() {
  const { t } = useI18n()
  const { signIn, signUp, signInWithProvider } = useAuth()
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{isSignUp ? t.auth.signUp : t.auth.signIn}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="email"
          placeholder={t.auth.email}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder={t.auth.password}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className={styles.submitBtn} type="submit">
          {isSignUp ? t.auth.signUp : t.auth.signIn}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <hr className={styles.divider} />
      <button className={styles.oauthBtn} onClick={() => signInWithProvider('google')}>
        {t.auth.google}
      </button>
      <button className={styles.oauthBtn} onClick={() => signInWithProvider('github')}>
        {t.auth.github}
      </button>
      <p>
        <button
          className={styles.toggleBtn}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
        </button>
      </p>
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { OAuthButton } from '../../components/OAuthButton'
import styles from './page.module.css'

export default function AuthPage() {
  const { t } = useI18n()
  const { signIn, signUp, signInWithProvider } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [oauthError, setOauthError] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setOauthError(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOauthError(false)
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

  const handleProvider = async (provider: 'google' | 'apple' | 'github') => {
    setOauthError(false)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth failed')
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
      {oauthError && <p className={styles.error}>{t.auth.oauthError}</p>}
      <hr className={styles.divider} />
      <OAuthButton onProviderClick={handleProvider} />
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

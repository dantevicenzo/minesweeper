'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import { api } from '../../lib/api'
import styles from './page.module.css'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const DEBOUNCE_MS = 400

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'banned'

export default function SetupUsernamePage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    const oauthFullName =
      (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
      (user.user_metadata as { full_name?: string; name?: string } | undefined)?.name ??
      ''
    if (oauthFullName) setFullName(oauthFullName)
  }, [user, router])

  const checkUsername = useCallback(async (value: string) => {
    if (!USERNAME_REGEX.test(value)) {
      setCheckState('invalid')
      return
    }
    setCheckState('checking')
    try {
      const result = await api.profiles.usernameAvailable(value)
      if (result.available) {
        setCheckState('available')
      } else {
        setCheckState(result.reason === 'taken' ? 'taken' : result.reason === 'banned' ? 'banned' : 'invalid')
      }
    } catch {
      setCheckState('idle')
    }
  }, [])

  useEffect(() => {
    if (!username) {
      setCheckState('idle')
      return
    }
    const handle = setTimeout(() => checkUsername(username), DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [username, checkUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (checkState !== 'available') return
    setSubmitting(true)
    setError('')
    try {
      await api.profiles.updateMe({ username, full_name: fullName || undefined })
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSubmitting(false)
    }
  }

  const feedbackMessage = () => {
    switch (checkState) {
      case 'checking': return t.setupUsername.checking
      case 'available': return t.setupUsername.available
      case 'taken': return t.setupUsername.taken
      case 'invalid': return t.setupUsername.invalid
      case 'banned': return t.setupUsername.banned
      default: return ''
    }
  }

  const canSubmit = checkState === 'available' && !submitting

  return (
    <main className={styles.page}>
      <h1>{t.setupUsername.title}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          {t.setupUsername.username}
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t.setupUsername.username}
            autoComplete="username"
            required
          />
        </label>
        {checkState !== 'idle' && (
          <p className={`${styles.feedback} ${checkState === 'available' ? styles.available : styles.taken}`}>
            {feedbackMessage()}
          </p>
        )}
        <label>
          {t.setupUsername.fullName}
          <input
            className={styles.input}
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={t.setupUsername.fullName}
            autoComplete="name"
          />
        </label>
        <button className={styles.submitBtn} type="submit" disabled={!canSubmit}>
          {t.setupUsername.submit}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </main>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'

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
    <main>
      <h1>{isSignUp ? t.auth.signUp : t.auth.signIn}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={t.auth.email}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t.auth.password}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {isSignUp ? t.auth.signUp : t.auth.signIn}
        </button>
      </form>
      {error && <p>{error}</p>}
      <hr />
      <button onClick={() => signInWithProvider('google')}>
        {t.auth.google}
      </button>
      <button onClick={() => signInWithProvider('github')}>
        {t.auth.github}
      </button>
      <p>
        <button onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
        </button>
      </p>
    </main>
  )
}

'use client'

import { type ReactNode } from 'react'
import { useI18n } from '../../contexts/I18nContext'
import styles from './OAuthButton.module.css'

type Provider = 'google' | 'apple' | 'github'

interface OAuthButtonProps {
  onProviderClick: (provider: Provider) => void
}

function GoogleIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M17.05 12.04c-.03-3.07 2.51-4.55 2.62-4.62-1.43-2.09-3.66-2.38-4.45-2.41-1.87-.19-3.68 1.11-4.64 1.11-.97 0-2.44-1.09-4.02-1.06-2.05.03-3.97 1.21-5.03 3.06-2.17 3.76-.55 9.29 1.53 12.33 1.04 1.49 2.26 3.15 3.86 3.09 1.56-.06 2.14-1 4.02-1 1.87 0 2.41 1 4.04.97 1.67-.03 2.72-1.49 3.72-2.99 1.2-1.71 1.68-3.38 1.7-3.47-.04-.02-3.24-1.24-3.27-4.92zm-3.1-9.04c.85-1.03 1.42-2.46 1.27-3.88-1.22.05-2.7.81-3.58 1.84-.79.91-1.48 2.37-1.29 3.76 1.36.1 2.75-.69 3.6-1.72z"/>
    </svg>
  )
}

const PROVIDERS: { provider: Provider; icon: () => ReactNode; disabled?: true }[] = [
  { provider: 'google', icon: GoogleIcon },
  { provider: 'github', icon: GitHubIcon },
  { provider: 'apple', icon: AppleIcon, disabled: true },
]

export function OAuthButton({ onProviderClick }: OAuthButtonProps) {
  const { t } = useI18n()

  return (
    <div className={styles.group}>
      {PROVIDERS.map(({ provider, icon: Icon, disabled }) => {
        const label = t.auth[provider]
        return (
          <button
            key={provider}
            type="button"
            className={styles.button}
            onClick={() => !disabled && onProviderClick(provider)}
            disabled={disabled}
            title={disabled ? t.auth.appleSoon : undefined}
            aria-disabled={disabled || undefined}
          >
            <Icon />
            {label}
          </button>
        )
      })}
    </div>
  )
}

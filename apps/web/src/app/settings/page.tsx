'use client'

import Link from 'next/link'
import { useI18n } from '../../contexts/I18nContext'
import styles from '../page.module.css'
import type { Locale } from '../../lib/i18n'

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>{'< Back'}</Link>
      <h1>{t.settings.title}</h1>
      <div>
        <label>{t.settings.language}</label>
        <select
          className={styles.select}
          value={locale}
          onChange={e => setLocale(e.target.value as Locale)}
        >
          <option value="en">English</option>
          <option value="pt-BR">Português</option>
        </select>
      </div>
    </main>
  )
}

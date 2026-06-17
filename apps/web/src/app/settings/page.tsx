'use client'

import { useI18n } from '../../contexts/I18nContext'
import type { Locale } from '../../lib/i18n'

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()

  return (
    <main>
      <h1>{t.settings.title}</h1>
      <div>
        <label>{t.settings.language}</label>
        <select
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

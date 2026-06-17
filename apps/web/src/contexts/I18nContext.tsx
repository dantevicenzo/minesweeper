'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { getMessages, getBrowserLocale } from '../lib/i18n'
import type { Locale, Messages } from '../lib/i18n'

interface I18nContextValue {
  locale: Locale
  t: Messages
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored === 'en' || stored === 'pt-BR') return stored
  } catch {}
  return getBrowserLocale()
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [t, setT] = useState<Messages>(() => getMessages('en'))

  useEffect(() => {
    const detected = getStoredLocale()
    setLocaleState(detected)
    setT(getMessages(detected))
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    setT(getMessages(newLocale))
    try { localStorage.setItem('locale', newLocale) } catch {}
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

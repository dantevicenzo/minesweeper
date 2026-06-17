'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getBrowserLocale)
  const [t, setT] = useState<Messages>(() => getMessages(getBrowserLocale()))

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    setT(getMessages(newLocale))
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

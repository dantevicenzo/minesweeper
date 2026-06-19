import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import en from '../messages/en.json'
import ptBR from '../messages/pt-BR.json'

type Locale = 'en' | 'pt-BR'
type Messages = typeof en

const messages: Record<Locale, Messages> = { en, 'pt-BR': ptBR }

function getDeviceLocale(): Locale {
  return 'en'
}

interface I18nContextValue {
  locale: Locale
  t: Messages
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    AsyncStorage.getItem('locale').then(saved => {
      if (saved === 'en' || saved === 'pt-BR') setLocaleState(saved)
      else setLocaleState(getDeviceLocale())
    })
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    AsyncStorage.setItem('locale', l)
  }

  const t = messages[locale]

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

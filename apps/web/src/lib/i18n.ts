import en from '../messages/en.json'
import ptBR from '../messages/pt-BR.json'

export type Locale = 'en' | 'pt-BR'
export type Messages = typeof en

const messages: Record<Locale, Messages> = {
  'en': en,
  'pt-BR': ptBR,
}

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.en
}

export function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language
  if (lang.startsWith('pt')) return 'pt-BR'
  return 'en'
}

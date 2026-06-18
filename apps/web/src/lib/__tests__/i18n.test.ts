import { describe, it, expect, afterAll, vi } from 'vitest'
import { getMessages, getBrowserLocale } from '../i18n'

vi.mock('../messages/en.json', () => ({
  default: { home: { title: 'Minesweeper' } },
}))

vi.mock('../messages/pt-BR.json', () => ({
  default: { home: { title: 'Campo Minado' } },
}))

describe('getMessages', () => {
  it('returns english messages', () => {
    const msgs = getMessages('en')
    expect(msgs.home.title).toBe('Minesweeper')
  })

  it('returns portuguese messages', () => {
    const msgs = getMessages('pt-BR')
    expect(msgs.home.title).toBe('Campo Minado')
  })

  it('falls back to english for unknown locale', () => {
    const msgs = getMessages('en')
    expect(msgs.home.title).toBe('Minesweeper')
  })
})

describe('getBrowserLocale', () => {
  const originalNavigator = globalThis.navigator

  afterAll(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    })
  })

  it('returns en when navigator is undefined', () => {
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true })
    expect(getBrowserLocale()).toBe('en')
  })

  it('returns en for non-portuguese language', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'es-ES' },
      configurable: true,
    })
    expect(getBrowserLocale()).toBe('en')
  })

  it('returns pt-BR for portuguese language', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'pt-BR' },
      configurable: true,
    })
    expect(getBrowserLocale()).toBe('pt-BR')
  })

  it('returns pt-BR for generic portuguese', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'pt' },
      configurable: true,
    })
    expect(getBrowserLocale()).toBe('pt-BR')
  })
})

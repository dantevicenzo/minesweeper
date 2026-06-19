import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'
import type { ReactNode } from 'react'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

function TestConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Light</button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

function renderWithProvider(ui: ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(cleanup)

describe('ThemeProvider', () => {
  it('renders children', () => {
    renderWithProvider(<div data-testid="child">hello</div>)
    expect(screen.getByTestId('child')).toBeDefined()
  })

  it('defaults to light theme when no preference is stored', () => {
    renderWithProvider(<TestConsumer />)
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('reads stored theme from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProvider(<TestConsumer />)
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('applies data-theme="dark" on dark theme', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProvider(<TestConsumer />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('removes data-theme attribute on light theme', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProvider(<TestConsumer />)
    fireEvent.click(screen.getByTestId('set-light'))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('toggles theme from light to dark', () => {
    renderWithProvider(<TestConsumer />)
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('toggles theme from dark to light', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProvider(<TestConsumer />)
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('persists theme to localStorage on set', () => {
    renderWithProvider(<TestConsumer />)
    fireEvent.click(screen.getByTestId('set-dark'))
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('sets theme via setTheme function', () => {
    renderWithProvider(<TestConsumer />)
    fireEvent.click(screen.getByTestId('set-dark'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    fireEvent.click(screen.getByTestId('set-light'))
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })
})

describe('useTheme', () => {
  it('throws when used outside ThemeProvider', () => {
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within ThemeProvider')
  })
})

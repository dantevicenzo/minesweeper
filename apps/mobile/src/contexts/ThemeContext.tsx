import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Appearance, useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = 'theme'

interface ThemeColors {
  bg: string
  bgSecondary: string
  surface: string
  border: string
  text: string
  textSecondary: string
  primary: string
  primaryHover: string
  danger: string
  success: string
  warning: string
  cellBg: string
  cellBgHover: string
  cellRevealed: string
  cellBorderLight: string
  cellBorderDark: string
  cellMineExploded: string
  flag: string
  mine: string
  counterBg: string
  counterText: string
  number: Record<number, string>
}

const lightColors: ThemeColors = {
  bg: '#f0f0f0', bgSecondary: '#e0e0e0', surface: '#ffffff', border: '#d4d4d4',
  text: '#1a1a1a', textSecondary: '#666666', primary: '#2563eb', primaryHover: '#1d4ed8',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
  cellBg: '#bdbdbd', cellBgHover: '#c8c8c8', cellRevealed: '#cecece',
  cellBorderLight: '#ffffff', cellBorderDark: '#7b7b7b', cellMineExploded: '#e74c3c',
  flag: '#dc2626', mine: '#1a1a1a', counterBg: '#1a0000', counterText: '#ff0000',
  number: { 1: '#0000ff', 2: '#008000', 3: '#ff0000', 4: '#000080', 5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080' },
}

const darkColors: ThemeColors = {
  bg: '#1a1a1a', bgSecondary: '#2a2a2a', surface: '#333333', border: '#555555',
  text: '#f0f0f0', textSecondary: '#a0a0a0', primary: '#3b82f6', primaryHover: '#60a5fa',
  danger: '#ef4444', success: '#22c55e', warning: '#f59e0b',
  cellBg: '#3a3a3a', cellBgHover: '#454545', cellRevealed: '#2a2a2a',
  cellBorderLight: '#5a5a5a', cellBorderDark: '#1a1a1a', cellMineExploded: '#992222',
  flag: '#ef4444', mine: '#cccccc', counterBg: '#330000', counterText: '#ff4444',
  number: { 1: '#6ba3ff', 2: '#4cce4c', 3: '#ff6666', 4: '#7a8cff', 5: '#ff8c66', 6: '#5ccccc', 7: '#cccccc', 8: '#999999' },
}

interface ThemeContextValue {
  theme: 'light' | 'dark'
  colors: ThemeColors
  toggleTheme: () => void
  setTheme: (t: 'light' | 'dark') => void
}

const ThemeContext = createContext<ThemeContextValue>(null!)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark') setThemeState(saved)
      else setThemeState(systemScheme === 'dark' ? 'dark' : 'light')
    })
  }, [systemScheme])

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t)
    AsyncStorage.setItem(THEME_KEY, t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  const colors = theme === 'light' ? lightColors : darkColors

  return <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

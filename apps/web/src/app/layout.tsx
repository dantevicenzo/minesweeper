import type { ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { I18nProvider } from '../contexts/I18nContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import './globals.css'

export const metadata = {
  title: 'Minesweeper',
  description: 'Classic minesweeper game',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider>
              {children}
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

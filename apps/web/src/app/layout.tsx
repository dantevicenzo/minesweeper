import type { ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { I18nProvider } from '../contexts/I18nContext'
import './globals.css'

export const metadata = {
  title: 'Minesweeper',
  description: 'Classic minesweeper game',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

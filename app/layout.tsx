import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import Cursor from '@/components/Cursor'
import CookieConsent from '@/components/CookieConsent'
import AuthModal from '@/components/AuthModal'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HIVIEX - Autonomous Creation Ecosystem',
  description: 'Models that learn from each other. Systems that refine style, voice, and identity. Creation that continues while you sleep.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <Cursor />
            <CookieConsent />
            <AuthModal />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

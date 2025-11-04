import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import SessionProvider from '@/components/providers/SessionProvider'
import Cursor from '@/components/Cursor'
import CookieConsent from '@/components/CookieConsent'
import AuthModal from '@/components/AuthModal'
import Onboarding from '@/components/Onboarding'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'HIVIEX - Autonomous Creation Ecosystem',
    template: '%s | HIVIEX',
  },
  description: 'Models that learn from each other. Systems that refine style, voice, and identity. Creation that continues while you sleep.',
  keywords: ['AI', 'autonomous creation', 'artificial intelligence', 'creative AI', 'autonomous ecosystem'],
  authors: [{ name: 'HIVIEX' }],
  creator: 'HIVIEX',
  publisher: 'HIVIEX',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hiviex.com',
    siteName: 'HIVIEX',
    title: 'HIVIEX - Autonomous Creation Ecosystem',
    description: 'Models that learn from each other. Systems that refine style, voice, and identity. Creation that continues while you sleep.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HIVIEX - Autonomous Creation Ecosystem',
    description: 'Models that learn from each other. Systems that refine style, voice, and identity.',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>
            <AuthProvider>
              <Cursor />
              <CookieConsent />
              <AuthModal />
              <Onboarding />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

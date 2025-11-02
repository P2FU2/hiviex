import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Cursor from '@/components/Cursor'


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
          <Cursor />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

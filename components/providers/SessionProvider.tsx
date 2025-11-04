/**
 * Session Provider Wrapper
 * 
 * Wraps NextAuth SessionProvider for client components
 */

'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}


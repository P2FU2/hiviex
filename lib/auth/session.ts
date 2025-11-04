/**
 * Server Session Helper
 * 
 * Helper function to get the current session in server components
 * Compatible with NextAuth v5 beta
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Get the current authenticated session
 * Redirects to sign-in if not authenticated
 * Guarantees that session.user exists
 */
export async function getAuthSession() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/signin')
  }
  
  // Type assertion: we've verified user exists above
  return session as typeof session & { user: { id: string; email?: string; name?: string | null; image?: string | null } }
}


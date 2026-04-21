/**
 * Server Session Helper
 *
 * - getAuthSession: páginas Server Components (redirect HTML)
 * - getApiSession: Route Handlers / API (401 JSON, sem redirect)
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export type SessionUser = {
  id: string
  email?: string
  name?: string | null
  image?: string | null
}

export type AppSession = NonNullable<Awaited<ReturnType<typeof auth>>> & {
  user: SessionUser
}

/**
 * Páginas autenticadas: redireciona para /signin se não houver sessão.
 */
export async function getAuthSession(): Promise<AppSession> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/signin')
  }

  return session as AppSession
}

/**
 * API Routes: nunca chama redirect(); retorna null se anônimo.
 */
export async function getApiSession(): Promise<AppSession | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session as AppSession
}


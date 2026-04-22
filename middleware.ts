/**
 * Proteção de /dashboard e APIs (JWT via cookie NextAuth).
 * Rotas públicas: auth, webhooks, health, flow webhook externo, OAuth integrações.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getNextAuthSecret } from '@/lib/auth/secrets'

function isPublicApiPath(pathname: string): boolean {
  if (pathname.startsWith('/api/auth')) return true
  if (pathname === '/api/auth/register') return true
  if (pathname.startsWith('/api/webhooks/')) return true
  if (pathname.startsWith('/api/health')) return true
  if (/^\/api\/flows\/[^/]+\/webhook$/.test(pathname)) return true
  if (pathname.startsWith('/api/integrations/oauth')) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth =
    pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/api/') && !isPublicApiPath(pathname))

  if (!needsAuth) {
    return NextResponse.next()
  }

  let secret: string
  try {
    secret = getNextAuthSecret()
  } catch {
    return pathname.startsWith('/dashboard')
      ? NextResponse.redirect(new URL('/signin', request.url))
      : NextResponse.json(
          { error: 'Configuração de autenticação indisponível' },
          { status: 503 }
        )
  }

  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  if (!token) {
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}

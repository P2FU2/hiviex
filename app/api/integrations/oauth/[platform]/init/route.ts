/**
 * OAuth Init Handler
 * 
 * Inicia o fluxo OAuth e redireciona para a plataforma
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { createProvider } from '@/lib/integrations/providers'
import type { SocialPlatform } from '@/lib/types/domain'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> | { platform: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const platform = resolvedParams.platform.toUpperCase() as SocialPlatform
    const tenantId = request.nextUrl.searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    // Verificar acesso ao tenant
    const tenantMemberships = await getUserTenants(session.user.id)
    const hasAccess = tenantMemberships.some((tm: any) => tm.tenantId === tenantId)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Criar provider e obter URL de autorização
    const provider = createProvider(platform)
    const redirectUri = `${request.nextUrl.origin}/api/integrations/oauth/${platform}`
    const state = `${tenantId}:${session.user.id}` // Para validar no callback

    const authUrl = provider.getAuthUrl(state, redirectUri)

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('OAuth init error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize OAuth' },
      { status: 500 }
    )
  }
}


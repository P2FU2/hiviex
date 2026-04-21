/**
 * OAuth Callback Handler
 * 
 * Recebe o callback OAuth das plataformas e salva os tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { createProvider } from '@/lib/integrations/providers'
import type { SocialPlatform } from '@/lib/types/domain'
import { encrypt } from '@/lib/utils/encryption'
import { verifyOAuthState } from '@/lib/auth/oauth-state'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> | { platform: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    const resolvedParams = await Promise.resolve(params)
    const platform = resolvedParams.platform.toUpperCase() as SocialPlatform

    // Verificar se é callback OAuth
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
    }

    const parsed = verifyOAuthState(state)
    if (!parsed || parsed.userId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid or expired OAuth state' }, { status: 400 })
    }
    const { tenantId } = parsed

    // Verificar acesso ao tenant
    const tenantMemberships = await getUserTenants(session.user.id)
    const hasAccess = tenantMemberships.some((tm: any) => tm.tenantId === tenantId)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Exchange code for tokens
    const provider = createProvider(platform)
    const redirectUri = `${request.nextUrl.origin}/api/integrations/oauth/${platform}`
    const tokens = await provider.exchangeCodeForTokens(code, redirectUri)

    // Obter informações da conta
    const accountInfo = await provider.getAccountInfo(tokens)

    const accessTokenEnc = encrypt(tokens.accessToken)
    const refreshTokenEnc = tokens.refreshToken ? encrypt(tokens.refreshToken) : null

    const pageId = accountInfo.metadata?.pageId as string | undefined
    const meta: Record<string, unknown> = {
      name: accountInfo.name,
      avatar: accountInfo.avatar,
      ...accountInfo.metadata,
    }
    if (accountInfo.pageAccessToken) {
      meta.pageAccessTokenEnc = encrypt(accountInfo.pageAccessToken)
    }

    await (prisma as any).socialAccount.upsert({
      where: {
        tenantId_platform_platformUserId: {
          tenantId,
          platform,
          platformUserId: accountInfo.userId,
        },
      },
      create: {
        tenantId,
        platform,
        status: 'CONNECTED',
        platformUserId: accountInfo.userId,
        platformUsername: accountInfo.username,
        platformPageId: pageId ?? null,
        accessToken: accessTokenEnc,
        refreshToken: refreshTokenEnc,
        tokenExpiresAt: tokens.expiresAt,
        tokenScope: tokens.scope,
        metadata: meta,
      },
      update: {
        status: 'CONNECTED',
        platformPageId: pageId ?? null,
        accessToken: accessTokenEnc,
        refreshToken: refreshTokenEnc,
        tokenExpiresAt: tokens.expiresAt,
        tokenScope: tokens.scope,
        lastSyncAt: new Date(),
        lastError: null,
        metadata: meta,
      },
    })

    return NextResponse.redirect(
      new URL(`/dashboard/integrations?success=${encodeURIComponent(platform)}`, request.url)
    )
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations?error=${encodeURIComponent(error.message || 'OAuth failed')}`,
        request.url
      )
    )
  }
}


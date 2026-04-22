/**
 * Stripe Customer Portal — gerir método de pagamento e cancelamento.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TenantRole } from '@prisma/client'
import { getApiSession } from '@/lib/auth/session'
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe-client'
import { ensureSubscriptionForTenant } from '@/lib/billing/ensure-subscription'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  tenantId: z.string().min(1),
})

function appOrigin(request: NextRequest): string {
  return (
    request.headers.get('origin')?.replace(/\/$/, '') ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe não configurado.' },
        { status: 503 }
      )
    }

    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 })
    }

    const { tenantId } = parsed.data

    const membership = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: { tenantId, userId: session.user.id },
      },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (
      membership.role !== TenantRole.ADMIN &&
      membership.role !== TenantRole.OWNER
    ) {
      return NextResponse.json(
        { error: 'Apenas administradores podem gerir billing.' },
        { status: 403 }
      )
    }

    const subRow = await ensureSubscriptionForTenant(tenantId)
    if (!subRow.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            'Ainda não existe cliente Stripe para este workspace. Subscreva um plano pago primeiro.',
        },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const origin = appOrigin(request)
    const portal = await stripe.billingPortal.sessions.create({
      customer: subRow.stripeCustomerId,
      return_url: `${origin}/dashboard/billing`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (e) {
    console.error('billing portal error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao abrir portal' },
      { status: 500 }
    )
  }
}

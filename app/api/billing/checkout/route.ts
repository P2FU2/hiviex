/**
 * Cria sessão Stripe Checkout (modo subscription).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TenantRole } from '@prisma/client'
import { getApiSession } from '@/lib/auth/session'
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe-client'
import { getStripePriceIdForPlan } from '@/lib/billing/plan-config'
import { ensureSubscriptionForTenant } from '@/lib/billing/ensure-subscription'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  tenantId: z.string().min(1),
  planType: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
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
        {
          error:
            'Stripe não configurado. Defina STRIPE_SECRET_KEY e os Price IDs no .env.',
        },
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
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, planType } = parsed.data

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

    const priceId = getStripePriceIdForPlan(planType)
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Price ID Stripe em falta para o plano ${planType} (ex.: STRIPE_PRICE_${planType}).`,
        },
        { status: 503 }
      )
    }

    const subRow = await ensureSubscriptionForTenant(tenantId)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    })
    if (!tenant) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 })
    }

    const stripe = getStripe()
    let customerId = subRow.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        metadata: { tenantId },
      })
      customerId = customer.id
      await prisma.subscription.update({
        where: { tenantId },
        data: { stripeCustomerId: customerId },
      })
    }

    const origin = appOrigin(request)
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?success=1`,
      cancel_url: `${origin}/dashboard/billing?canceled=1`,
      metadata: {
        tenantId,
        planType,
      },
      subscription_data: {
        metadata: {
          tenantId,
          planType,
        },
      },
      allow_promotion_codes: true,
    })

    if (!checkout.url) {
      return NextResponse.json(
        { error: 'Stripe não devolveu URL de checkout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: checkout.url })
  } catch (e) {
    console.error('billing checkout error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao criar checkout' },
      { status: 500 }
    )
  }
}

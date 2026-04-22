import type { SubscriptionStatus, PlanType } from '@prisma/client'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db/prisma'
import {
  PLAN_REQUEST_LIMITS,
  planTypeFromStripePriceId,
} from '@/lib/billing/plan-config'

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE'
    case 'past_due':
      return 'PAST_DUE'
    case 'canceled':
    case 'unpaid':
      return 'CANCELED'
    default:
      return 'INCOMPLETE'
  }
}

export async function syncSubscriptionFromStripe(
  sub: Stripe.Subscription
): Promise<void> {
  const tenantId = sub.metadata?.tenantId
  if (!tenantId) {
    console.warn('[stripe] Subscription sem metadata.tenantId', sub.id)
    return
  }

  await ensureSubscriptionRow(tenantId)

  const priceId = sub.items.data[0]?.price?.id
  const meta = sub.metadata?.planType
  const planType: PlanType =
    meta === 'STARTER' ||
    meta === 'PROFESSIONAL' ||
    meta === 'ENTERPRISE' ||
    meta === 'FREE'
      ? meta
      : planTypeFromStripePriceId(priceId)

  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id

  await prisma.subscription.update({
    where: { tenantId },
    data: {
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId ?? undefined,
      stripePriceId: priceId ?? null,
      status: mapStripeStatus(sub.status),
      planType,
      monthlyRequestsLimit: PLAN_REQUEST_LIMITS[planType],
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
    },
  })
}

export async function downgradeSubscriptionToFree(
  tenantId: string
): Promise<void> {
  await prisma.subscription.update({
    where: { tenantId },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      status: 'CANCELED',
      planType: 'FREE',
      monthlyRequestsLimit: PLAN_REQUEST_LIMITS.FREE,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    },
  })
}

async function ensureSubscriptionRow(tenantId: string) {
  const row = await prisma.subscription.findUnique({ where: { tenantId } })
  if (!row) {
    await prisma.subscription.create({
      data: {
        tenantId,
        status: 'INCOMPLETE',
        planType: 'FREE',
        monthlyRequestsLimit: PLAN_REQUEST_LIMITS.FREE,
      },
    })
  }
}

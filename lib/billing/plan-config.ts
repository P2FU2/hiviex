import type { PlanType } from '@prisma/client'

export const PLAN_REQUEST_LIMITS: Record<PlanType, number> = {
  FREE: 100,
  STARTER: 1_000,
  PROFESSIONAL: 10_000,
  ENTERPRISE: 999_999,
}

export function getStripePriceIdForPlan(
  plan: Exclude<PlanType, 'FREE'>
): string | null {
  const map: Record<Exclude<PlanType, 'FREE'>, string | undefined> = {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL,
    ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
  }
  const id = map[plan]?.trim()
  return id || null
}

export function planTypeFromStripePriceId(
  priceId: string | undefined
): PlanType {
  if (!priceId) return 'FREE'
  if (priceId === process.env.STRIPE_PRICE_STARTER?.trim()) return 'STARTER'
  if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL?.trim())
    return 'PROFESSIONAL'
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE?.trim())
    return 'ENTERPRISE'
  return 'FREE'
}

import type { PlanType } from '@prisma/client'

/**
 * Os pedidos mensais (`subscription.monthlyRequests` / `monthlyRequestsLimit`) são um único
 * contador partilhado por todas as `UsageFeature`. Pesos ou buckets dedicados por feature
 * ficam para evolução do billing (observabilidade via `usage_records.metadata.feature`).
 */

export const PLAN_REQUEST_LIMITS: Record<PlanType, number> = {
  FREE: 100,
  STARTER: 1_000,
  PROFESSIONAL: 10_000,
  ENTERPRISE: 999_999,
}

/** Limite de chamadas de embedding (API OpenAI) por tenant por dia UTC. */
export const PLAN_EMBEDDING_DAILY_LIMITS: Record<PlanType, number> = {
  FREE: 30,
  STARTER: 200,
  PROFESSIONAL: 2_000,
  ENTERPRISE: 50_000,
}

export function embeddingDailyLimitForPlan(plan: PlanType): number {
  const env = process.env.EMBEDDING_DAILY_LIMIT_OVERRIDE
  if (env && /^\d+$/.test(env)) {
    const n = parseInt(env, 10)
    if (n >= 0) return n
  }
  return PLAN_EMBEDDING_DAILY_LIMITS[plan]
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

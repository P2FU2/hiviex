import { prisma } from '@/lib/db/prisma'
import { ensureSubscriptionForTenant } from '@/lib/billing/ensure-subscription'

/** Operações que consomem quota mensal (mesmo contador `monthlyRequests`). */
export type UsageFeature =
  | 'llm_chat'
  | 'flow_execution'
  | 'content_generation'

export async function isWithinUsageLimit(
  tenantId: string,
  _feature?: UsageFeature
): Promise<boolean> {
  await ensureSubscriptionForTenant(tenantId)
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { monthlyRequests: true, monthlyRequestsLimit: true },
  })
  if (!sub) return true
  // Reserva: futuro por-feature via metadata no Subscription
  return sub.monthlyRequests < sub.monthlyRequestsLimit
}

/**
 * Regista uso após operação bem-sucedida.
 * `amount` — unidades a incrementar (por defeito 1).
 */
export async function recordTenantUsage(
  tenantId: string,
  options: {
    feature: UsageFeature
    amount?: number
    tokens?: number
  }
): Promise<void> {
  const amount = Math.max(1, options.amount ?? 1)
  await ensureSubscriptionForTenant(tenantId)
  await prisma.subscription.update({
    where: { tenantId },
    data: {
      monthlyRequests: { increment: amount },
    },
  })
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { id: true },
  })
  if (sub) {
    await prisma.usageRecord.create({
      data: {
        subscriptionId: sub.id,
        requests: amount,
        tokens: options.tokens,
        metadata: { feature: options.feature } as object,
      },
    })
  }
}

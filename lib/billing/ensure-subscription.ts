import { prisma } from '@/lib/db/prisma'
import { PLAN_REQUEST_LIMITS } from '@/lib/billing/plan-config'

/** Garante uma linha Subscription por tenant (FREE por defeito). */
export async function ensureSubscriptionForTenant(tenantId: string) {
  const existing = await prisma.subscription.findUnique({
    where: { tenantId },
  })
  if (existing) return existing

  return prisma.subscription.create({
    data: {
      tenantId,
      status: 'INCOMPLETE',
      planType: 'FREE',
      monthlyRequests: 0,
      monthlyRequestsLimit: PLAN_REQUEST_LIMITS.FREE,
    },
  })
}

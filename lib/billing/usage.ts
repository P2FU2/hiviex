import { prisma } from '@/lib/db/prisma'
import { ensureSubscriptionForTenant } from '@/lib/billing/ensure-subscription'
import { embeddingDailyLimitForPlan } from '@/lib/billing/plan-config'
import type { PlanType } from '@prisma/client'

export type UsageFeature =
  | 'llm_chat'
  | 'flow_execution'
  | 'content_generation'
  | 'embedding_generation'
  | 'influencer_identity_pack'
  | 'influencer_preview'
  | 'video_ingest'
  | 'video_transcribe'
  | 'video_analysis'
  | 'video_render'

export class EmbeddingQuotaExceededError extends Error {
  constructor() {
    super('Limite diário de embeddings atingido para este workspace.')
    this.name = 'EmbeddingQuotaExceededError'
  }
}

function utcStartOfDay(d = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  )
}

/** Estimativa rápida (não atómica) — use tryReserveMonthlyUsage antes de operações caras. */
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
  return sub.monthlyRequests < sub.monthlyRequestsLimit
}

/**
 * Reserva unidades no contador mensal (atómico). Falha se quota insuficiente.
 * Usar antes de LLM / arranque de flow; em falha chamar releaseMonthlyUsage.
 */
export async function tryReserveMonthlyUsage(
  tenantId: string,
  amount: number,
  _feature: UsageFeature
): Promise<boolean> {
  await ensureSubscriptionForTenant(tenantId)
  const n = Math.max(1, Math.floor(amount))
  const updated = await prisma.$executeRaw`
    UPDATE subscriptions
    SET "monthlyRequests" = "monthlyRequests" + ${n}
    WHERE "tenantId" = ${tenantId}
      AND "monthlyRequests" + ${n} <= "monthlyRequestsLimit"
  `
  return Number(updated) > 0
}

export async function releaseMonthlyUsage(
  tenantId: string,
  amount: number
): Promise<void> {
  const n = Math.max(1, Math.floor(amount))
  await prisma.$executeRaw`
    UPDATE subscriptions
    SET "monthlyRequests" = GREATEST(0, "monthlyRequests" - ${n})
    WHERE "tenantId" = ${tenantId}
  `
}

/** Registo de auditoria (não altera monthlyRequests — já reservado). */
export async function appendUsageAuditLog(
  tenantId: string,
  options: {
    feature: UsageFeature
    amount?: number
    tokens?: number
  }
): Promise<void> {
  const amount = Math.max(1, options.amount ?? 1)
  await ensureSubscriptionForTenant(tenantId)
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { id: true },
  })
  if (!sub) return
  await prisma.usageRecord.create({
    data: {
      subscriptionId: sub.id,
      requests: amount,
      tokens: options.tokens,
      metadata: { feature: options.feature } as object,
    },
  })
}

/**
 * Reserva 1 slot de embedding para o dia UTC corrente (contador diário separado do mensal).
 */
export async function tryReserveEmbeddingGeneration(
  tenantId: string
): Promise<boolean> {
  await ensureSubscriptionForTenant(tenantId)
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { planType: true },
  })
  if (!sub) return false
  const limit = embeddingDailyLimitForPlan(sub.planType as PlanType)
  if (limit <= 0) return false
  const dayStart = utcStartOfDay()
  const updated = await prisma.$executeRaw`
    UPDATE subscriptions
    SET
      "embeddingsDailyCount" = CASE
        WHEN "embeddingsDailyUtc" IS NULL OR "embeddingsDailyUtc" < ${dayStart} THEN 1
        ELSE "embeddingsDailyCount" + 1
      END,
      "embeddingsDailyUtc" = CASE
        WHEN "embeddingsDailyUtc" IS NULL OR "embeddingsDailyUtc" < ${dayStart} THEN ${dayStart}
        ELSE "embeddingsDailyUtc"
      END
    WHERE "tenantId" = ${tenantId}
      AND (
        "embeddingsDailyUtc" IS NULL
        OR "embeddingsDailyUtc" < ${dayStart}
        OR "embeddingsDailyCount" < ${limit}
      )
  `
  return Number(updated) > 0
}

export async function releaseEmbeddingGeneration(
  tenantId: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE subscriptions
    SET "embeddingsDailyCount" = GREATEST(0, "embeddingsDailyCount" - 1)
    WHERE "tenantId" = ${tenantId}
  `
}

/**
 * @deprecated Prefer tryReserveMonthlyUsage + appendUsageAuditLog, ou fluxos com release explícito.
 */
export async function recordTenantUsage(
  tenantId: string,
  options: {
    feature: UsageFeature
    amount?: number
    tokens?: number
  }
): Promise<void> {
  const reserved = await tryReserveMonthlyUsage(
    tenantId,
    options.amount ?? 1,
    options.feature
  )
  if (!reserved) {
    throw new Error('USAGE_LIMIT_EXCEEDED')
  }
  await appendUsageAuditLog(tenantId, options)
}

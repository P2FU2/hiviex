/**
 * Inicia uma execução de flow (manual, webhook ou API interna).
 */

import { prisma } from '@/lib/db/prisma'
import { validateFlow } from '@/lib/flows/validators'
import { FlowExecutionQueue } from '@/lib/queue/flow-execution-queue'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'
import { runFlowExecutionJob } from '@/lib/flows/run-flow-execution'
import type { Prisma } from '@prisma/client'
import {
  tryReserveMonthlyUsage,
  releaseMonthlyUsage,
  type UsageFeature,
} from '@/lib/billing/usage'
import { createLogger } from '@/lib/observability/logger'

const log = createLogger('flow-execute')

type FlowGraph = Prisma.FlowGetPayload<{
  include: {
    nodes: {
      include: { agent: true }
      orderBy: { createdAt: 'asc' }
    }
    connections: true
  }
}>

export type StartFlowExecutionResult =
  | { ok: true; execution: Awaited<ReturnType<typeof prisma.flowExecution.create>> }
  | { ok: false; status: number; body: Record<string, unknown> }

/**
 * @param allowDraft — se true, permite DRAFT e ACTIVE (painel “Executar”). Se false, só ACTIVE (webhook).
 * @param checkUsageLimit — reserva quota mensal de forma atómica (tryReserve) antes de criar execução.
 */
export async function startFlowExecution(
  flow: FlowGraph,
  input: Record<string, unknown>,
  options: {
    allowDraft: boolean
    logMessage?: string
    checkUsageLimit?: boolean
    usageFeature?: UsageFeature
  }
): Promise<StartFlowExecutionResult> {
  const checkUsage = options.checkUsageLimit !== false
  let reservedUsage = false

  const canRun =
    flow.status === 'ACTIVE' ||
    (options.allowDraft && flow.status === 'DRAFT')

  if (!canRun) {
    return {
      ok: false,
      status: options.allowDraft ? 400 : 404,
      body: options.allowDraft
        ? { error: 'Flow is not active' }
        : { error: 'Not found' },
    }
  }

  const validation = validateFlow(flow.nodes, flow.connections)
  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'Flow validation failed',
        details: validation.errors,
        warnings: validation.warnings,
      },
    }
  }

  if (checkUsage) {
    const ok = await tryReserveMonthlyUsage(
      flow.tenantId,
      1,
      options.usageFeature ?? 'flow_execution'
    )
    if (!ok) {
      return {
        ok: false,
        status: 429,
        body: {
          error: 'Limite mensal de utilização atingido para este workspace.',
          code: 'USAGE_LIMIT_EXCEEDED',
        },
      }
    }
    reservedUsage = true
  }

  const baseLog = {
    timestamp: new Date(),
    nodeId: '',
    nodeLabel: 'System',
    level: 'info' as const,
    message: options.logMessage || 'Flow execution started',
  }

  let execution: Awaited<ReturnType<typeof prisma.flowExecution.create>>
  try {
    execution = await prisma.flowExecution.create({
      data: {
        flowId: flow.id,
        status: 'PENDING',
        input: input as Prisma.InputJsonValue,
        usageReserved: reservedUsage,
        logs: [
          baseLog,
          ...validation.warnings.map((warning) => ({
            timestamp: new Date(),
            nodeId: '',
            nodeLabel: 'System',
            level: 'warning' as const,
            message: warning,
          })),
        ],
      },
    })
  } catch (e) {
    if (reservedUsage) {
      await releaseMonthlyUsage(flow.tenantId, 1).catch(() => {})
    }
    throw e
  }

  const redisConfigured = !!(
    process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim()
  )

  if (!redisConfigured) {
    if (process.env.NODE_ENV === 'production') {
      if (reservedUsage) {
        await releaseMonthlyUsage(flow.tenantId, 1).catch(() => {})
      }
      await prisma.flowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error:
            'Redis não configurado — defina REDIS_URL ou REDIS_HOST para executar fluxos.',
          usageReserved: false,
        },
      })
      return {
        ok: false,
        status: 503,
        body: {
          error:
            'Execução de fluxos em produção exige Redis (REDIS_URL). Configure o worker e tente novamente.',
        },
      }
    }
    void runFlowExecutionJob(execution.id, flow.tenantId).catch((err) =>
      log.error('inline dev run failed', err, {
        executionId: execution.id,
        tenantId: flow.tenantId,
      })
    )
    return { ok: true, execution }
  }

  try {
    const queue = new FlowExecutionQueue(getBullMQConnection())
    await queue.enqueue({
      executionId: execution.id,
      tenantId: flow.tenantId,
    })
    await queue.close()
  } catch (queueErr) {
    log.error('Flow execution enqueue failed', queueErr, {
      executionId: execution.id,
      tenantId: flow.tenantId,
    })
    if (reservedUsage) {
      await releaseMonthlyUsage(flow.tenantId, 1).catch(() => {})
    }
    await prisma.flowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        error: 'Fila de execução indisponível. Verifique Redis e o worker.',
        usageReserved: false,
      },
    })
    return {
      ok: false,
      status: 503,
      body: {
        error: 'Fila de jobs indisponível. Tente novamente em instantes.',
      },
    }
  }

  return { ok: true, execution }
}

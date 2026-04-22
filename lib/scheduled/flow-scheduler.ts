/**
 * Dispara flows com trigger SCHEDULED (intervalo em triggerConfig.intervalMinutes).
 */

import { prisma } from '@/lib/db/prisma'
import { startFlowExecution } from '@/lib/flows/start-flow-execution'
import { createLogger } from '@/lib/observability/logger'

const log = createLogger('flow-scheduler')

function getIntervalMs(triggerConfig: unknown): number {
  const c =
    triggerConfig && typeof triggerConfig === 'object'
      ? (triggerConfig as Record<string, unknown>)
      : {}
  const minutes = Math.min(
    1440,
    Math.max(1, Number(c.intervalMinutes) || 15)
  )
  return minutes * 60_000
}

function getLastScheduledAt(triggerConfig: unknown): string | undefined {
  const c =
    triggerConfig && typeof triggerConfig === 'object'
      ? (triggerConfig as Record<string, unknown>)
      : {}
  const v = c.lastScheduledAt
  return typeof v === 'string' ? v : undefined
}

/**
 * Uma passagem do ticker (ex.: a cada 60s). Reserva janela com transação; reverte lastScheduledAt em 429.
 */
export async function tickScheduledFlows(): Promise<void> {
  const flows = await prisma.flow.findMany({
    where: { status: 'ACTIVE', triggerType: 'SCHEDULED' },
    select: { id: true },
  })

  for (const { id } of flows) {
    const snapshot = await prisma.flow.findUnique({
      where: { id },
      select: { triggerConfig: true },
    })
    if (!snapshot) continue

    const intervalMs = getIntervalMs(snapshot.triggerConfig)
    const previousLast = getLastScheduledAt(snapshot.triggerConfig)

    const claimed = await prisma.$transaction(async (tx) => {
      const f = await tx.flow.findUnique({
        where: { id },
        select: { triggerConfig: true, status: true, triggerType: true },
      })
      if (!f || f.status !== 'ACTIVE' || f.triggerType !== 'SCHEDULED') {
        return false
      }
      const cfg =
        f.triggerConfig && typeof f.triggerConfig === 'object'
          ? { ...(f.triggerConfig as Record<string, unknown>) }
          : {}
      const lastStr = cfg.lastScheduledAt
      const lastAt = typeof lastStr === 'string' ? new Date(lastStr).getTime() : 0
      if (lastAt && Date.now() - lastAt < intervalMs) {
        return false
      }
      cfg.lastScheduledAt = new Date().toISOString()
      await tx.flow.update({
        where: { id },
        data: { triggerConfig: cfg as object },
      })
      return true
    })

    if (!claimed) continue

    const fullFlow = await prisma.flow.findUnique({
      where: { id },
      include: {
        nodes: {
          include: { agent: true },
          orderBy: { createdAt: 'asc' },
        },
        connections: true,
      },
    })
    if (!fullFlow) continue

    const started = await startFlowExecution(
      fullFlow,
      {},
      {
        allowDraft: false,
        checkUsageLimit: true,
        usageFeature: 'flow_execution',
        logMessage: 'Flow execution started (scheduled trigger)',
      }
    )

    if (!started.ok && started.status === 429) {
      await prisma.flow.update({
        where: { id },
        data: {
          triggerConfig: (() => {
            const base =
              snapshot.triggerConfig &&
              typeof snapshot.triggerConfig === 'object'
                ? { ...(snapshot.triggerConfig as Record<string, unknown>) }
                : {}
            if (previousLast) {
              base.lastScheduledAt = previousLast
            } else {
              delete base.lastScheduledAt
            }
            return base as object
          })(),
        },
      })
      log.warn('scheduled flow skipped — quota', { flowId: id })
      continue
    }

    if (!started.ok) {
      log.warn('scheduled flow start failed', {
        flowId: id,
        status: started.status,
        body: started.body,
      })
    }
  }
}

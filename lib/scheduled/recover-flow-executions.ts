/**
 * Recupera execuções presas (RUNNING ou PENDING antigas) e liberta reservas de quota.
 */

import { prisma } from '@/lib/db/prisma'
import { releaseMonthlyUsage } from '@/lib/billing/usage'
import { createLogger } from '@/lib/observability/logger'

const log = createLogger('flow-recover')

const RUNNING_STALE_MS =
  Number(process.env.FLOW_RUNNING_STALE_MS) || 15 * 60 * 1000
const PENDING_STALE_MS =
  Number(process.env.FLOW_PENDING_STALE_MS) || 2 * 60 * 60 * 1000

export async function recoverStuckFlowExecutions(): Promise<number> {
  const now = Date.now()
  const runningCutoff = new Date(now - RUNNING_STALE_MS)
  const pendingCutoff = new Date(now - PENDING_STALE_MS)

  const stuck = await prisma.flowExecution.findMany({
    where: {
      OR: [
        { status: 'RUNNING', updatedAt: { lt: runningCutoff } },
        { status: 'PENDING', createdAt: { lt: pendingCutoff } },
      ],
    },
    include: {
      flow: { select: { tenantId: true, name: true } },
    },
    take: 100,
  })

  let n = 0
  for (const ex of stuck) {
    const msg =
      ex.status === 'RUNNING'
        ? 'Execução interrompida (RUNNING excedeu o tempo sem atualização).'
        : 'Execução não foi processada a tempo (PENDING).'

    if (ex.usageReserved) {
      try {
        await releaseMonthlyUsage(ex.flow.tenantId, 1)
      } catch (e) {
        log.error('releaseMonthlyUsage no recovery falhou', e, {
          executionId: ex.id,
          tenantId: ex.flow.tenantId,
        })
      }
    }

    await prisma.flowExecution.update({
      where: { id: ex.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: msg,
        usageReserved: false,
      },
    })

    log.warn('flow execution recovered as FAILED', {
      executionId: ex.id,
      flowId: ex.flowId,
      tenantId: ex.flow.tenantId,
      priorStatus: ex.status,
    })
    n++
  }

  return n
}

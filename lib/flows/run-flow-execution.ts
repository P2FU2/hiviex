/**
 * Execução completa de um FlowExecution (usada pelo worker BullMQ ou fallback dev).
 */

import { prisma } from '@/lib/db/prisma'
import { FlowExecutionEngine } from '@/lib/flows/execution-engine'
import { recordTenantUsage } from '@/lib/billing/usage'
import { createLogger } from '@/lib/observability/logger'

const log = createLogger('flow-run')

export async function runFlowExecutionJob(
  executionId: string,
  expectedTenantId?: string
): Promise<void> {
  const runStarted = Date.now()
  const execution = await prisma.flowExecution.findUnique({
    where: { id: executionId },
    include: {
      flow: {
        include: {
          nodes: {
            include: { agent: true },
            orderBy: { createdAt: 'asc' },
          },
          connections: true,
        },
      },
    },
  })

  if (!execution) {
    throw new Error(`Flow execution ${executionId} not found`)
  }

  if (
    expectedTenantId &&
    execution.flow.tenantId !== expectedTenantId
  ) {
    throw new Error(
      'Flow execution tenant mismatch — recusado por segurança multi-tenant.'
    )
  }

  if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
    return
  }

  const locked = await prisma.flowExecution.updateMany({
    where: { id: executionId, status: 'PENDING' },
    data: { status: 'RUNNING' },
  })

  if (locked.count === 0) {
    const cur = await prisma.flowExecution.findUnique({
      where: { id: executionId },
      select: { status: true },
    })
    if (
      cur?.status === 'COMPLETED' ||
      cur?.status === 'FAILED' ||
      cur?.status === 'CANCELLED'
    ) {
      return
    }
    if (cur?.status === 'RUNNING') {
      return
    }
    throw new Error('Could not claim flow execution for processing')
  }

  const flow = execution.flow
  const input = (execution.input as Record<string, any>) || {}

  try {
    const engine = new FlowExecutionEngine(
      executionId,
      flow.id,
      flow.tenantId,
      flow.nodes,
      flow.connections
    )

    const result = await engine.execute(input)

    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
        output: result.output as object | undefined,
        logs: result.logs as object | undefined,
        error: result.success ? null : 'Flow execution failed',
      },
    })

    const durationMs = Date.now() - runStarted
    log.info('flow execution finished', {
      executionId,
      tenantId: flow.tenantId,
      flowId: flow.id,
      success: result.success,
      durationMs,
    })

    if (result.success) {
      try {
        await recordTenantUsage(flow.tenantId, { feature: 'flow_execution' })
      } catch (usageErr) {
        log.error('recordTenantUsage failed after successful flow', usageErr, {
          executionId,
          tenantId: flow.tenantId,
        })
      }
    }

    for (const [nodeId, nodeResult] of Array.from(result.nodeResults.entries())) {
      await prisma.flowNodeExecution.create({
        data: {
          executionId,
          nodeId,
          status: nodeResult.success ? 'COMPLETED' : 'FAILED',
          startedAt: new Date(Date.now() - nodeResult.duration),
          completedAt: new Date(),
          input: input as object,
          output: nodeResult.output as object | undefined,
          logs: nodeResult.logs as object | undefined,
          error: nodeResult.error,
        },
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error('runFlowExecutionJob failed', error, {
      executionId,
      tenantId: execution.flow.tenantId,
      flowId: execution.flow.id,
    })
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureException(error, {
        tags: { area: 'flow_execution' },
        extra: {
          executionId,
          tenantId: execution.flow.tenantId,
          flowId: execution.flow.id,
        },
      })
    } catch {
      /* Sentry opcional */
    }
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: errorMessage,
      },
    })
    throw error
  }
}

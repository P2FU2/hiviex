/**
 * Flow Execution API Route
 * POST: Execute a flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { validateFlow } from '@/lib/flows/validators'
import { FlowExecutionQueue } from '@/lib/queue/flow-execution-queue'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'
import { runFlowExecutionJob } from '@/lib/flows/run-flow-execution'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const flowId = resolvedParams.id
    const body = await request.json()
    const input = body.input || {}

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Get flow with nodes and connections
    const flow = await prisma.flow.findFirst({
      where: {
        id: flowId,
        tenantId: { in: tenantIds },
      },
      include: {
        nodes: {
          include: {
            agent: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        connections: true,
      },
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    if (flow.status !== 'ACTIVE' && flow.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Flow is not active' },
        { status: 400 }
      )
    }

    // Validate flow before execution
    const validation = validateFlow(flow.nodes, flow.connections)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Flow validation failed',
          details: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      )
    }

    // Create execution record
    const execution = await prisma.flowExecution.create({
      data: {
        flowId,
        status: 'PENDING',
        input,
        logs: [
          {
            timestamp: new Date(),
            nodeId: '',
            nodeLabel: 'System',
            level: 'info',
            message: 'Flow execution started',
          },
          ...(validation.warnings.length > 0
            ? validation.warnings.map((warning) => ({
                timestamp: new Date(),
                nodeId: '',
                nodeLabel: 'System',
                level: 'warning',
                message: warning,
              }))
            : []),
        ],
      },
    })

    const redisConfigured = !!(
      process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim()
    )

    if (!redisConfigured) {
      if (process.env.NODE_ENV === 'production') {
        await prisma.flowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            error: 'Redis não configurado — defina REDIS_URL ou REDIS_HOST para executar fluxos.',
          },
        })
        return NextResponse.json(
          {
            error:
              'Execução de fluxos em produção exige Redis (REDIS_URL). Configure o worker e tente novamente.',
          },
          { status: 503 }
        )
      }
      void runFlowExecutionJob(execution.id, flow.tenantId).catch((err) =>
        console.error('[flow execute] inline dev run failed', err)
      )
      return NextResponse.json(execution)
    }

    try {
      const queue = new FlowExecutionQueue(getBullMQConnection())
      await queue.enqueue({
        executionId: execution.id,
        tenantId: flow.tenantId,
      })
      await queue.close()
    } catch (queueErr) {
      console.error('Flow execution enqueue failed:', queueErr)
      await prisma.flowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: 'Fila de execução indisponível. Verifique Redis e o worker.',
        },
      })
      return NextResponse.json(
        { error: 'Fila de jobs indisponível. Tente novamente em instantes.' },
        { status: 503 }
      )
    }

    return NextResponse.json(execution)
  } catch (error) {
    console.error('Error executing flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


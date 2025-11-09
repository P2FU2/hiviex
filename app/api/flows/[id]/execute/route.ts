/**
 * Flow Execution API Route
 * POST: Execute a flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { FlowExecutionEngine } from '@/lib/flows/execution-engine'
import { validateFlow } from '@/lib/flows/validators'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
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
    const flow = await (prisma as any).flow.findFirst({
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
    const execution = await (prisma as any).flowExecution.create({
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

    // Execute flow asynchronously
    executeFlowAsync(execution.id, flow, input)

    return NextResponse.json(execution)
  } catch (error) {
    console.error('Error executing flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Execute flow asynchronously
 */
async function executeFlowAsync(
  executionId: string,
  flow: any,
  input: Record<string, any>
) {
  try {
    // Update status to RUNNING
    await (prisma as any).flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'RUNNING',
      },
    })

    // Create execution engine
    const engine = new FlowExecutionEngine(
      executionId,
      flow.id,
      flow.nodes,
      flow.connections
    )

    // Execute flow
    const result = await engine.execute(input)

    // Update execution with results
    await (prisma as any).flowExecution.update({
      where: { id: executionId },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
        output: result.output,
        logs: result.logs,
        error: result.success ? null : 'Flow execution failed',
      },
    })

    // Save individual node executions
    for (const [nodeId, nodeResult] of Array.from(result.nodeResults.entries())) {
      await (prisma as any).flowNodeExecution.create({
        data: {
          executionId,
          nodeId,
          status: nodeResult.success ? 'COMPLETED' : 'FAILED',
          startedAt: new Date(Date.now() - nodeResult.duration),
          completedAt: new Date(),
          input: input,
          output: nodeResult.output,
          logs: nodeResult.logs,
          error: nodeResult.error,
        },
      })
    }
  } catch (error) {
    console.error('Error in flow execution:', error)
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    await (prisma as any).flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: errorMessage,
      },
    })
  }
}


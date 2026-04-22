/**
 * Webhook de entrada — dispara um flow ACTIVE com triggerType WEBHOOK (n8n, Zapier, etc.).
 *
 * POST com cabeçalho:
 *   X-Hiviex-Webhook-Secret: <secret>
 * ou Authorization: Bearer <secret>
 *
 * Corpo JSON torna-se o input da execução (ou use { "input": { ... } }).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { startFlowExecution } from '@/lib/flows/start-flow-execution'
import { compareWebhookSecrets } from '@/lib/flows/webhook-secret'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: flowId } = await Promise.resolve(params)

    const headerSecret = request.headers.get('x-hiviex-webhook-secret')?.trim()
    const auth = request.headers.get('authorization')?.trim()
    const bearer =
      auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    const provided = headerSecret || bearer || ''

    const flow = await prisma.flow.findFirst({
      where: {
        id: flowId,
        triggerType: 'WEBHOOK',
        status: 'ACTIVE',
      },
      include: {
        nodes: {
          include: { agent: true },
          orderBy: { createdAt: 'asc' },
        },
        connections: true,
      },
    })

    if (!flow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const cfg = flow.triggerConfig as { webhookSecret?: string } | null
    const secret = cfg?.webhookSecret
    if (!secret || !compareWebhookSecrets(provided, secret)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let body: unknown = {}
    try {
      const text = await request.text()
      if (text?.trim()) {
        body = JSON.parse(text) as unknown
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    let input: Record<string, unknown> = {}
    if (body === null || body === undefined) {
      input = {}
    } else if (Array.isArray(body)) {
      input = { items: body }
    } else if (
      typeof body === 'object' &&
      'input' in body &&
      (body as { input: unknown }).input !== null &&
      typeof (body as { input: unknown }).input === 'object' &&
      !Array.isArray((body as { input: unknown }).input)
    ) {
      input = (body as { input: Record<string, unknown> }).input
    } else if (typeof body === 'object' && body !== null) {
      input = body as Record<string, unknown>
    }

    const started = await startFlowExecution(flow, input, {
      allowDraft: false,
      logMessage: 'Flow execution started (HTTP webhook)',
    })

    if (!started.ok) {
      return NextResponse.json(started.body, { status: started.status })
    }

    return NextResponse.json({
      ok: true,
      executionId: started.execution.id,
      status: started.execution.status,
    })
  } catch (error) {
    console.error('Flow webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

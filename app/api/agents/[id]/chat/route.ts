/**
 * Agent Chat API Route
 * POST: Send message to agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import {
  isWithinUsageLimit,
  recordTenantUsage,
} from '@/lib/billing/usage'
import { createLogger } from '@/lib/observability/logger'

export const dynamic = 'force-dynamic'

const log = createLogger('agent-chat')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await Promise.resolve(params)
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Get agent
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: { in: tenantIds },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get tenant for message
    const tenantId = agent.tenantId

    const within = await isWithinUsageLimit(tenantId, 'llm_chat')
    if (!within) {
      return NextResponse.json(
        {
          error: 'Limite mensal de utilização atingido para este workspace.',
          code: 'USAGE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    // Save user message
    await prisma.message.create({
      data: {
        tenantId,
        agentId,
        role: 'USER',
        content: message,
      },
    })

    // Call LLM API
    let response: string
    try {
      const { LLMProvider } = await import('@/lib/llm/providers')
      const { getDecryptedWorkspaceApiSecret } = await import(
        '@/lib/services/workspace-api-secrets'
      )

      const metadata = agent.metadata as Record<string, unknown> | null
      const metaKey =
        metadata && typeof metadata.apiKey === 'string' ? metadata.apiKey : undefined
      const workspaceKey = await getDecryptedWorkspaceApiSecret(
        tenantId,
        agent.provider || 'openai'
      )
      const apiKey = metaKey || workspaceKey || undefined
      
      let systemPrompt =
        agent.personality || `Você é ${agent.name}. ${agent.description || ''}`

      if (process.env.RAG_ENABLED === 'true') {
        try {
          const { searchRelevantContext } = await import('@/lib/embeddings/search')
          const rag = await searchRelevantContext({
            tenantId,
            agentId,
            query: String(message).slice(0, 4000),
            limit: 4,
          })
          if (rag) {
            systemPrompt += `\n\nContexto relevante (base de conhecimento):\n${rag}`
          }
        } catch {
          /* RAG opcional */
        }
      }

      const llmResponse = await LLMProvider.call(systemPrompt, message, {
        provider: agent.provider || 'openai',
        apiKey,
        model: agent.model || 'gpt-4',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 2000,
      })
      
      response = llmResponse.content

      try {
        await recordTenantUsage(tenantId, {
          feature: 'llm_chat',
          tokens: llmResponse.metadata.tokensUsed,
        })
      } catch (usageErr) {
        log.error('recordTenantUsage falhou após chat', usageErr, {
          tenantId,
          agentId,
        })
      }
    } catch (error) {
      log.error('LLM API error', error, { tenantId, agentId })
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          {
            error: 'Falha ao gerar resposta. Verifique as chaves de API do provedor e tente novamente.',
          },
          { status: 502 }
        )
      }
      response = `Olá! Sou ${agent.name}. (dev) Falha no LLM: ${error instanceof Error ? error.message : String(error)}`
      void recordTenantUsage(tenantId, { feature: 'llm_chat' }).catch(() => {})
    }

    // Save assistant message
    await prisma.message.create({
      data: {
        tenantId,
        agentId,
        role: 'ASSISTANT',
        content: response,
      },
    })

    if (process.env.RAG_ENABLED === 'true' && process.env.OPENAI_API_KEY) {
      void import('@/lib/embeddings/search')
        .then(({ ingestEmbeddingDocument }) =>
          ingestEmbeddingDocument({
            content: `Q: ${String(message).slice(0, 6000)}\nA: ${response.slice(0, 6000)}`,
            metadata: {
              tenantId,
              agentId,
              source: 'chat_turn',
            },
          })
        )
        .catch(() => {
          /* ingest best-effort */
        })
    }

    return NextResponse.json({ response })
  } catch (error) {
    log.error('Error in chat', error, {})
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureException(error, { tags: { route: 'agent-chat' } })
    } catch {
      /* opcional */
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


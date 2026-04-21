/**
 * Agent Chat API Route
 * POST: Send message to agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agentId = params.id
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
      
      const systemPrompt = agent.personality || `Você é ${agent.name}. ${agent.description || ''}`
      
      const llmResponse = await LLMProvider.call(systemPrompt, message, {
        provider: agent.provider || 'openai',
        apiKey,
        model: agent.model || 'gpt-4',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 2000,
      })
      
      response = llmResponse.content
    } catch (error) {
      console.error('LLM API error:', error)
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          {
            error: 'Falha ao gerar resposta. Verifique as chaves de API do provedor e tente novamente.',
          },
          { status: 502 }
        )
      }
      response = `Olá! Sou ${agent.name}. (dev) Falha no LLM: ${error instanceof Error ? error.message : String(error)}`
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

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


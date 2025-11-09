/**
 * Agent Node Processor
 * 
 * Executa nós do tipo AGENT
 */

import { FlowContext, NodeExecutionResult, ExecutionLogEntry } from '../execution-engine'
import { prisma } from '@/lib/db/prisma'

interface FlowNode {
  id: string
  type: string
  agentId?: string | null
  label: string
  config?: any
}

export class AgentProcessor {
  static async execute(
    node: FlowNode,
    context: FlowContext
  ): Promise<NodeExecutionResult> {
    const logs: ExecutionLogEntry[] = []
    const startTime = Date.now()

    try {
      if (!node.agentId) {
        return {
          success: false,
          error: 'Agent ID not specified',
          logs,
          duration: Date.now() - startTime,
        }
      }

      // Get agent configuration
      const agent = await prisma.agent.findUnique({
        where: { id: node.agentId },
      })

      if (!agent) {
        return {
          success: false,
          error: `Agent ${node.agentId} not found`,
          logs,
          duration: Date.now() - startTime,
        }
      }

      // Get persona separately if needed
      // Use type assertion since Prisma Client may need regeneration
      let persona: any = null
      try {
        persona = await (prisma as any).agentPersona?.findUnique({
          where: { agentId: agent.id },
        })
      } catch {
        // Fallback: query directly if Prisma Client not regenerated
        const result = await prisma.$queryRaw<Array<any>>`
          SELECT * FROM agent_personas WHERE "agentId" = ${agent.id} LIMIT 1
        `
        persona = result[0] || null
      }

      logs.push({
        timestamp: new Date(),
        nodeId: node.id,
        nodeLabel: node.label,
        level: 'info',
        message: `Executing agent: ${agent.name}`,
      })

      // Get input from context (from previous nodes)
      const input = this.getNodeInput(node, context)

      // Prepare agent prompt with context
      const systemPrompt = this.buildSystemPrompt(agent, persona, node.config)
      const userMessage = this.formatInput(input, node.config)

      // Execute agent (call LLM)
      const output = await this.callAgent(agent, persona, systemPrompt, userMessage)

      logs.push({
        timestamp: new Date(),
        nodeId: node.id,
        nodeLabel: node.label,
        level: 'success',
        message: 'Agent execution completed',
        data: { output },
      })

      return {
        success: true,
        output,
        logs,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logs.push({
        timestamp: new Date(),
        nodeId: node.id,
        nodeLabel: node.label,
        level: 'error',
        message: `Agent execution failed: ${errorMessage}`,
      })

      return {
        success: false,
        error: errorMessage,
        logs,
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * Get input for this node from previous nodes
   */
  private static getNodeInput(
    node: FlowNode,
    context: FlowContext
  ): Record<string, any> {
    // Get outputs from all source nodes
    const input: Record<string, any> = {}

    // Merge all outputs from previous nodes
    const nodeOutputsArray = Array.from(context.nodeOutputs.entries())
    for (const [nodeId, output] of nodeOutputsArray) {
      if (typeof output === 'object' && output !== null) {
        Object.assign(input, output)
      } else {
        input[nodeId] = output
      }
    }

    // Also include global variables
    Object.assign(input, context.variables)

    return input
  }

  /**
   * Build system prompt from agent configuration
   */
  private static buildSystemPrompt(agent: any, persona: any, nodeConfig: any): string {
    let prompt = agent.personality || ''

    // Add persona information if available
    if (persona) {
      if (persona.objective) {
        prompt += `\n\nObjetivo: ${persona.objective}`
      }
      if (persona.voiceTone) {
        prompt += `\n\nTom de voz: ${persona.voiceTone}`
      }
      if (persona.style) {
        prompt += `\n\nEstilo: ${persona.style}`
      }
    }

    // Add node-specific instructions
    if (nodeConfig?.instructions) {
      prompt += `\n\nInstruções específicas: ${nodeConfig.instructions}`
    }

    return prompt
  }

  /**
   * Format input for agent
   */
  private static formatInput(input: Record<string, any>, nodeConfig: any): string {
    if (nodeConfig?.inputFormat === 'json') {
      return JSON.stringify(input, null, 2)
    }

    if (nodeConfig?.inputTemplate) {
      // Replace placeholders in template
      let template = nodeConfig.inputTemplate
      for (const [key, value] of Object.entries(input)) {
        template = template.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value))
      }
      return template
    }

    // Default: format as text
    return Object.entries(input)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  }

  /**
   * Call agent LLM
   */
  private static async callAgent(
    agent: any,
    persona: any,
    systemPrompt: string,
    userMessage: string
  ): Promise<any> {
    try {
      const { LLMProvider } = await import('@/lib/llm/providers')
      
      // Get API key from agent metadata or environment
      const apiKey = agent.metadata?.apiKey || undefined

      const response = await LLMProvider.call(systemPrompt, userMessage, {
        provider: agent.provider || 'openai',
        apiKey,
        model: agent.model || 'gpt-4',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 2000,
      })

      return {
        content: response.content,
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          model: response.metadata.model,
          provider: response.metadata.provider,
          tokensUsed: response.metadata.tokensUsed,
        },
      }
    } catch (error) {
      // Fallback to mock if API key not configured
      console.warn('LLM API call failed, using mock response:', error)
      
      return {
        content: `[MOCK] Agent ${agent.name} processed: ${userMessage.substring(0, 100)}...\n\nNote: Configure API key in settings to use real LLM.`,
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          model: agent.model,
          provider: agent.provider,
          error: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }
}


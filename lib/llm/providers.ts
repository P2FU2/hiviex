/**
 * LLM Providers — OpenAI Chat Completions, Anthropic Messages, Cohere Chat v2.
 */

import { LLM_DEFAULTS, resolveLlmModel, resolveMaxOutputTokens } from '@/lib/llm/model-defaults'

interface LLMConfig {
  provider: string
  apiKey?: string
  model: string
  temperature?: number
  maxTokens?: number
}

interface LLMResponse {
  content: string
  metadata: {
    provider: string
    model: string
    tokensUsed?: number
  }
}

function anthropicExtractText(data: { content?: Array<{ type?: string; text?: string }> }): string {
  const blocks = data.content
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
}

export class LLMProvider {
  static async call(
    systemPrompt: string,
    userMessage: string,
    config: LLMConfig
  ): Promise<LLMResponse> {
    switch (config.provider.toLowerCase()) {
      case 'openai':
        return this.callOpenAI(systemPrompt, userMessage, config)
      case 'anthropic':
        return this.callAnthropic(systemPrompt, userMessage, config)
      case 'cohere':
        return this.callCohere(systemPrompt, userMessage, config)
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  private static async callOpenAI(
    systemPrompt: string,
    userMessage: string,
    config: LLMConfig
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const model = resolveLlmModel('openai', config.model)
    const maxTokens = resolveMaxOutputTokens(config.maxTokens)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    return {
      content: typeof text === 'string' ? text : '',
      metadata: {
        provider: 'openai',
        model: data.model || model,
        tokensUsed: data.usage?.total_tokens,
      },
    }
  }

  private static async callAnthropic(
    systemPrompt: string,
    userMessage: string,
    config: LLMConfig
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const model = resolveLlmModel('anthropic', config.model)
    const maxTokens = resolveMaxOutputTokens(config.maxTokens)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: config.temperature ?? 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`Anthropic API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const content = anthropicExtractText(data)

    const inTok = typeof data.usage?.input_tokens === 'number' ? data.usage.input_tokens : 0
    const outTok = typeof data.usage?.output_tokens === 'number' ? data.usage.output_tokens : 0

    return {
      content,
      metadata: {
        provider: 'anthropic',
        model: data.model || model,
        tokensUsed: inTok + outTok || undefined,
      },
    }
  }

  /**
   * Cohere Chat API v2 (substitui /v1/generate legado).
   */
  private static async callCohere(
    systemPrompt: string,
    userMessage: string,
    config: LLMConfig
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.COHERE_API_KEY

    if (!apiKey) {
      throw new Error('Cohere API key not configured')
    }

    const model = resolveLlmModel('cohere', config.model)
    const maxTokens = resolveMaxOutputTokens(config.maxTokens)

    const response = await fetch('https://api.cohere.ai/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        stream: false,
        model,
        temperature: config.temperature ?? 0.7,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`Cohere API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const parts = data.message?.content
    let text = ''
    if (Array.isArray(parts)) {
      text = parts
        .map((b: { text?: string }) => (typeof b?.text === 'string' ? b.text : ''))
        .join('')
    }

    const billedIn =
      typeof data.meta?.tokens?.input_tokens === 'number'
        ? data.meta.tokens.input_tokens
        : typeof data.meta?.billed_units?.input_tokens === 'number'
          ? data.meta.billed_units.input_tokens
          : 0
    const billedOut =
      typeof data.meta?.tokens?.output_tokens === 'number'
        ? data.meta.tokens.output_tokens
        : typeof data.meta?.billed_units?.output_tokens === 'number'
          ? data.meta.billed_units.output_tokens
          : 0

    return {
      content: text,
      metadata: {
        provider: 'cohere',
        model: data.model || model,
        tokensUsed: billedIn + billedOut || undefined,
      },
    }
  }

  static getApiKey(provider: string, userApiKey?: string): string | undefined {
    if (userApiKey) return userApiKey

    const envKeys: Record<string, string> = {
      openai: process.env.OPENAI_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      cohere: process.env.COHERE_API_KEY || '',
    }

    return envKeys[provider.toLowerCase()] || undefined
  }
}

// Re-export for call sites that only need defaults
export { LLM_DEFAULTS, resolveLlmModel, resolveMaxOutputTokens }

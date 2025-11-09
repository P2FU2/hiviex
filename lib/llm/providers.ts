/**
 * LLM Providers Integration
 * 
 * Integração com diferentes provedores de LLM (OpenAI, Anthropic, etc.)
 */

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

export class LLMProvider {
  /**
   * Call LLM based on provider
   */
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

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(
    systemPrompt: string,
    userMessage: string,
    config: LLMConfig
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()

      return {
        content: data.choices[0]?.message?.content || '',
        metadata: {
          provider: 'openai',
          model: config.model,
          tokensUsed: data.usage?.total_tokens,
        },
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw error
    }
  }

  /**
   * Call Anthropic API
   */
  private static async callAnthropic(
    systemPrompt: string,
    userMessage: string,
    config: LLMConfig
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-opus-20240229',
          max_tokens: config.maxTokens || 2000,
          temperature: config.temperature || 0.7,
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

      return {
        content: data.content[0]?.text || '',
        metadata: {
          provider: 'anthropic',
          model: config.model,
          tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
        },
      }
    } catch (error) {
      console.error('Anthropic API error:', error)
      throw error
    }
  }

  /**
   * Call Cohere API
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

    try {
      const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`

      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'command',
          prompt: fullPrompt,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Cohere API error: ${JSON.stringify(error)}`)
      }

      const data = await response.json()

      return {
        content: data.generations[0]?.text || '',
        metadata: {
          provider: 'cohere',
          model: config.model,
          tokensUsed: data.meta?.tokens?.input_tokens + data.meta?.tokens?.output_tokens,
        },
      }
    } catch (error) {
      console.error('Cohere API error:', error)
      throw error
    }
  }

  /**
   * Get API key from environment or user config
   */
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


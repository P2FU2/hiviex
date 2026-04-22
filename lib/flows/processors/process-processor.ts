/**
 * Process Node Processor
 * 
 * Executa nós do tipo PROCESS (tarefas, automações, integrações)
 */

import { FlowContext, NodeExecutionResult, ExecutionLogEntry } from '../execution-engine'
import { safeEvaluateConditionString } from '@/lib/flows/safe-condition'
import { prisma } from '@/lib/db/prisma'

interface FlowNode {
  id: string
  type: string
  processType?: string | null
  label: string
  config?: any
}

export class ProcessProcessor {
  static async execute(
    node: FlowNode,
    context: FlowContext
  ): Promise<NodeExecutionResult> {
    const logs: ExecutionLogEntry[] = []
    const startTime = Date.now()

    try {
      const processType = node.processType || 'TASK'
      const config = (node.config || {}) as Record<string, any>

      logs.push({
        timestamp: new Date(),
        nodeId: node.id,
        nodeLabel: node.label,
        level: 'info',
        message: `Executing process: ${processType}`,
      })

      // Get input from context
      const input = this.getNodeInput(node, context)

      let output: any

      switch (processType) {
        case 'TASK':
          output = await this.executeTask(node, input, config, logs)
          break
        case 'AUTOMATION':
          output = await this.executeAutomation(node, input, config, logs, context)
          break
        case 'INTEGRATION':
          output = await this.executeIntegration(node, input, config, logs, context)
          break
        case 'TRIGGER':
          output = await this.executeTrigger(node, input, config, logs)
          break
        case 'RULE':
          output = await this.executeRule(node, input, config, logs)
          break
        default:
          throw new Error(`Unknown process type: ${processType}`)
      }

      logs.push({
        timestamp: new Date(),
        nodeId: node.id,
        nodeLabel: node.label,
        level: 'success',
        message: 'Process execution completed',
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
        message: `Process execution failed: ${errorMessage}`,
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
   * Get input for this node
   */
  private static getNodeInput(
    node: FlowNode,
    context: FlowContext
  ): Record<string, any> {
    const input: Record<string, any> = {}

    // Merge outputs from previous nodes
    Array.from(context.nodeOutputs.entries()).forEach(([nodeId, output]) => {
      if (typeof output === 'object' && output !== null) {
        Object.assign(input, output)
      } else {
        input[nodeId] = output
      }
    })

    // Include global variables
    Object.assign(input, context.variables)

    return input
  }

  /**
   * Execute a task
   */
  private static async executeTask(
    node: FlowNode,
    input: Record<string, any>,
    config: Record<string, any>,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    const taskType = config.taskType || 'default'

    switch (taskType) {
      case 'transform':
        return this.transformData(input, config)
      case 'filter':
        return this.filterData(input, config)
      case 'aggregate':
        return this.aggregateData(input, config)
      case 'delay':
        await this.delay(config.delay || 1000)
        return input
      default:
        // Default task: pass through with optional transformation
        if (config.transform) {
          return this.applyTransform(input, config.transform)
        }
        return input
    }
  }

  /**
   * Execute an automation
   */
  private static async executeAutomation(
    node: FlowNode,
    input: Record<string, any>,
    config: Record<string, any>,
    logs: ExecutionLogEntry[],
    flowContext: FlowContext
  ): Promise<any> {
    // Automation can trigger external systems, send emails, etc.
    const automationType = config.automationType || 'default'

    switch (automationType) {
      case 'webhook':
        return await this.callWebhook(config, input, logs)
      case 'email':
        return await this.sendEmail(
          config.emailConfig,
          input,
          logs,
          flowContext.tenantId
        )
      case 'notification':
        return await this.sendNotification(
          config.notificationConfig,
          input,
          logs,
          flowContext
        )
      default:
        return input
    }
  }

  /**
   * Execute an integration
   */
  private static async executeIntegration(
    node: FlowNode,
    input: Record<string, any>,
    config: Record<string, any>,
    logs: ExecutionLogEntry[],
    flowContext: FlowContext
  ): Promise<any> {
    const integrationType = config.integrationType || 'default'

    switch (integrationType) {
      case 'api':
        return await this.callAPI(
          config.apiConfig,
          input,
          logs,
          flowContext.tenantId
        )
      case 'database':
        return await this.queryDatabase(
          config.dbConfig,
          input,
          logs,
          flowContext.tenantId
        )
      case 'file':
        return await this.processFile(config.fileConfig, input, logs)
      default:
        return input
    }
  }

  /**
   * Execute a trigger
   */
  private static async executeTrigger(
    node: FlowNode,
    input: Record<string, any>,
    config: Record<string, any>,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    // Triggers are usually entry points, just pass through
    return input
  }

  /**
   * Execute a rule
   */
  private static async executeRule(
    node: FlowNode,
    input: Record<string, any>,
    config: Record<string, any>,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    // Rules can apply business logic, validations, etc.
    const rule = config.rule || {}

    if (rule.condition) {
      const conditionMet = this.evaluateCondition(rule.condition, input)
      if (conditionMet) {
        return rule.then || input
      } else {
        return rule.else || input
      }
    }

    return input
  }

  // Helper methods

  private static transformData(
    input: Record<string, any>,
    config: Record<string, any>
  ): any {
    if (config.mapping) {
      const output: Record<string, any> = {}
      for (const [key, value] of Object.entries(config.mapping)) {
        output[key] = this.resolveValue(value, input)
      }
      return output
    }
    return input
  }

  private static filterData(
    input: Record<string, any>,
    config: Record<string, any>
  ): any {
    if (Array.isArray(input)) {
      return input.filter((item) => {
        if (config.filter) {
          return this.evaluateCondition(config.filter, item)
        }
        return true
      })
    }
    return input
  }

  private static aggregateData(
    input: Record<string, any>,
    config: Record<string, any>
  ): any {
    if (Array.isArray(input)) {
      const operation = config.operation || 'sum'
      const field = config.field

      switch (operation) {
        case 'sum':
          return input.reduce((acc, item) => acc + (item[field] || 0), 0)
        case 'avg':
          return (
            input.reduce((acc, item) => acc + (item[field] || 0), 0) /
            input.length
          )
        case 'count':
          return input.length
        case 'min':
          return Math.min(...input.map((item) => item[field] || 0))
        case 'max':
          return Math.max(...input.map((item) => item[field] || 0))
        default:
          return input
      }
    }
    return input
  }

  private static applyTransform(
    input: any,
    transform: string
  ): any {
    // Simple transform: can be expanded
    try {
      // Replace variables in transform string
      let result = transform
      for (const [key, value] of Object.entries(input)) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value))
      }
      return result
    } catch {
      return input
    }
  }

  private static evaluateCondition(
    condition: string,
    context: Record<string, any>
  ): boolean {
    return safeEvaluateConditionString(condition, context as Record<string, unknown>)
  }

  private static resolveValue(
    value: any,
    context: Record<string, any>
  ): any {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const key = value.slice(2, -1)
      return context[key]
    }
    return value
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private static async callWebhook(
    config: Record<string, any>,
    data: any,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    const url = config.webhookUrl as string | undefined
    if (!url || typeof url !== 'string') {
      logs.push({
        timestamp: new Date(),
        nodeId: '',
        nodeLabel: '',
        level: 'error',
        message: 'automationType webhook: webhookUrl em falta',
      })
      return { success: false, error: 'webhookUrl em falta' }
    }

    const method = (config.webhookMethod as string) || 'POST'
    const timeoutMs = Math.min(
      Math.max(Number(config.timeoutMs) || 30_000, 1000),
      120_000
    )
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(typeof config.webhookHeaders === 'object' && config.webhookHeaders
        ? config.webhookHeaders
        : {}),
    }

    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'info',
      message: `${method} webhook: ${url}`,
    })

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(data),
        signal: AbortSignal.timeout(timeoutMs),
      })
      const text = await res.text()
      let parsed: unknown = text
      try {
        parsed = text ? JSON.parse(text) : null
      } catch {
        /* corpo não-JSON */
      }
      if (!res.ok) {
        logs.push({
          timestamp: new Date(),
          nodeId: '',
          nodeLabel: '',
          level: 'error',
          message: `Webhook HTTP ${res.status}: ${text.slice(0, 500)}`,
        })
        return {
          success: false,
          status: res.status,
          body: parsed,
        }
      }
      return { success: true, status: res.status, body: parsed }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      logs.push({
        timestamp: new Date(),
        nodeId: '',
        nodeLabel: '',
        level: 'error',
        message: `Webhook falhou: ${msg}`,
      })
      return { success: false, error: msg }
    }
  }

  private static interpolate(
    template: string,
    data: Record<string, unknown>
  ): string {
    let out = template
    for (const [key, value] of Object.entries(data)) {
      out = out.replace(
        new RegExp(`\\$\\{${key}\\}`, 'g'),
        value !== null && value !== undefined ? String(value) : ''
      )
    }
    return out
  }

  /** Bloqueia destinos óbvios de SSRF (rede interna / metadata cloud). */
  private static isBlockedHttpUrl(urlStr: string): boolean {
    try {
      const u = new URL(urlStr)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return true
      const host = u.hostname.toLowerCase()
      if (
        host === 'localhost' ||
        host === '0.0.0.0' ||
        host.endsWith('.localhost')
      ) {
        return true
      }
      if (host.startsWith('127.')) return true
      if (host.startsWith('10.')) return true
      if (host.startsWith('192.168.')) return true
      if (host.startsWith('172.')) {
        const parts = host.split('.')
        const second = Number(parts[1])
        if (second >= 16 && second <= 31) return true
      }
      if (host.startsWith('169.254.')) return true
      if (host === '[::1]' || host === '::1') return true
      return false
    } catch {
      return true
    }
  }

  private static async sendEmail(
    config: Record<string, unknown> | undefined,
    data: Record<string, unknown>,
    logs: ExecutionLogEntry[],
    tenantId: string
  ): Promise<unknown> {
    const c = (config || {}) as Record<string, unknown>
    const toRaw = c.to
    const subjectRaw = (c.subject as string) || 'Notificação (flow)'
    const textRaw = (c.text as string) || ''
    const htmlRaw = typeof c.html === 'string' ? c.html : undefined

    const to =
      typeof toRaw === 'string'
        ? this.interpolate(toRaw, data)
        : Array.isArray(toRaw)
          ? toRaw.map(String).join(',')
          : ''

    if (!to.trim()) {
      logs.push({
        timestamp: new Date(),
        nodeId: '',
        nodeLabel: '',
        level: 'error',
        message: 'email: destinatário (to) em falta',
      })
      return { success: false, error: 'missing_to' }
    }

    const host = process.env.SMTP_HOST
    if (!host) {
      logs.push({
        timestamp: new Date(),
        nodeId: '',
        nodeLabel: '',
        level: 'warning',
        message: 'SMTP_HOST não definido — e-mail não enviado',
      })
      return { success: false, skipped: true, reason: 'SMTP_HOST unset' }
    }

    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'info',
      message: `Enviar e-mail para ${to.slice(0, 80)}…`,
    })

    const { default: nodemailer } = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    })

    const from =
      (c.from as string) ||
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      'noreply@hiviex.local'

    const textFinal = textRaw ? this.interpolate(textRaw, data) : undefined
    const htmlFinal = htmlRaw ? this.interpolate(htmlRaw, data) : undefined

    const mail: {
      from: string
      to: string
      subject: string
      text?: string
      html?: string
    } = {
      from,
      to,
      subject: this.interpolate(subjectRaw, data),
    }
    if (htmlFinal) mail.html = htmlFinal
    if (textFinal) mail.text = textFinal
    if (!mail.text && !mail.html) mail.text = '(sem corpo)'

    await transporter.sendMail(mail)

    return { success: true, tenantId, to }
  }

  private static async sendNotification(
    config: Record<string, unknown> | undefined,
    data: Record<string, unknown>,
    logs: ExecutionLogEntry[],
    context: FlowContext
  ): Promise<unknown> {
    const c = (config || {}) as Record<string, unknown>
    const title = typeof c.title === 'string' ? c.title : 'Flow notification'
    const channel = typeof c.channel === 'string' ? c.channel : 'flow'

    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'info',
      message: `Registar notificação: ${title}`,
    })

    await prisma.analytics.create({
      data: {
        tenantId: context.tenantId,
        flowId: context.flowId,
        channel,
        metadata: {
          kind: 'flow_notification',
          title: this.interpolate(title, data),
          body:
            typeof c.body === 'string'
              ? this.interpolate(c.body, data)
              : undefined,
          payload: data,
          executionId: context.executionId,
        } as object,
      },
    })

    return { success: true, recorded: true }
  }

  private static async callAPI(
    config: Record<string, unknown> | undefined,
    data: Record<string, unknown>,
    logs: ExecutionLogEntry[],
    tenantId: string
  ): Promise<unknown> {
    const c = (config || {}) as Record<string, unknown>
    const urlTemplate = (c.url as string) || ''
    const url = this.interpolate(urlTemplate, data)

    if (!url || this.isBlockedHttpUrl(url)) {
      logs.push({
        timestamp: new Date(),
        nodeId: '',
        nodeLabel: '',
        level: 'error',
        message: 'API: URL inválida ou bloqueada (SSRF)',
      })
      return { success: false, error: 'invalid_or_blocked_url', tenantId }
    }

    const method = ((c.method as string) || 'GET').toUpperCase()
    const timeoutMs = Math.min(
      Math.max(Number(c.timeoutMs) || 30_000, 1000),
      120_000
    )
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(typeof c.headers === 'object' && c.headers && !Array.isArray(c.headers)
        ? (c.headers as Record<string, string>)
        : {}),
    }

    let body: string | undefined
    if (method !== 'GET' && method !== 'HEAD') {
      if (c.bodyTemplate && typeof c.bodyTemplate === 'string') {
        body = this.interpolate(c.bodyTemplate, data)
      } else if (c.jsonBody && typeof c.jsonBody === 'object') {
        body = JSON.stringify(c.jsonBody)
      } else {
        body = JSON.stringify(data)
      }
    }

    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'info',
      message: `${method} ${url.slice(0, 120)}`,
    })

    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      })
      const text = await res.text()
      let parsed: unknown = text
      try {
        parsed = text ? JSON.parse(text) : null
      } catch {
        /* não JSON */
      }
      if (!res.ok) {
        logs.push({
          timestamp: new Date(),
          nodeId: '',
          nodeLabel: '',
          level: 'error',
          message: `API HTTP ${res.status}: ${text.slice(0, 400)}`,
        })
        return {
          success: false,
          status: res.status,
          body: parsed,
          tenantId,
        }
      }
      return { success: true, status: res.status, body: parsed, tenantId }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      logs.push({
        timestamp: new Date(),
        nodeId: '',
        nodeLabel: '',
        level: 'error',
        message: `API falhou: ${msg}`,
      })
      return { success: false, error: msg, tenantId }
    }
  }

  private static async queryDatabase(
    config: Record<string, unknown> | undefined,
    data: Record<string, unknown>,
    logs: ExecutionLogEntry[],
    tenantId: string
  ): Promise<unknown> {
    const c = (config || {}) as Record<string, unknown>
    const model = String(c.model || 'Message').trim()
    const take = Math.min(Math.max(Number(c.take) || 20, 1), 100)

    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'info',
      message: `DB read: ${model} (take=${take})`,
    })

    switch (model) {
      case 'Message': {
        const rows = await prisma.message.findMany({
          where: { tenantId },
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            agentId: true,
          },
        })
        return { success: true, model, rows, tenantId }
      }
      case 'Agent': {
        const rows = await prisma.agent.findMany({
          where: { tenantId },
          take,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            provider: true,
            model: true,
          },
        })
        return { success: true, model, rows, tenantId }
      }
      case 'Flow': {
        const rows = await prisma.flow.findMany({
          where: { tenantId },
          take,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            status: true,
            triggerType: true,
          },
        })
        return { success: true, model, rows, tenantId }
      }
      case 'ScheduledPost': {
        const rows = await (prisma as any).scheduledPost.findMany({
          where: { tenantId },
          take,
          orderBy: { scheduledAt: 'desc' },
          select: {
            id: true,
            status: true,
            caption: true,
            scheduledAt: true,
            platform: true,
          },
        })
        return { success: true, model, rows, tenantId }
      }
      case 'MediaAsset': {
        const rows = await (prisma as any).mediaAsset.findMany({
          where: { tenantId },
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            mimeType: true,
            cdnUrl: true,
            createdAt: true,
          },
        })
        return { success: true, model, rows, tenantId }
      }
      default:
        logs.push({
          timestamp: new Date(),
          nodeId: '',
          nodeLabel: '',
          level: 'error',
          message: `Modelo DB não permitido: ${model}`,
        })
        return {
          success: false,
          error: `model_not_allowed: ${model}`,
          allowed: [
            'Message',
            'Agent',
            'Flow',
            'ScheduledPost',
            'MediaAsset',
          ],
        }
    }
  }

  private static async processFile(
    config: Record<string, unknown> | undefined,
    data: Record<string, unknown>,
    logs: ExecutionLogEntry[]
  ): Promise<unknown> {
    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'warning',
      message:
        'Nó ficheiro: sem download remoto por defeito (SSRF). Use transform/passthrough.',
    })
    const c = (config || {}) as Record<string, unknown>
    if (c.mode === 'passthrough') {
      return { success: true, data }
    }
    return {
      success: false,
      error:
        'Defina config.mode=passthrough ou use API de media; URLs remotas não são processadas aqui.',
    }
  }
}


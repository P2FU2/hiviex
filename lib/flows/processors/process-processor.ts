/**
 * Process Node Processor
 * 
 * Executa nós do tipo PROCESS (tarefas, automações, integrações)
 */

import type { ProcessType } from '@/lib/types/domain'
import { FlowContext, NodeExecutionResult, ExecutionLogEntry } from '../execution-engine'

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
          output = await this.executeAutomation(node, input, config, logs)
          break
        case 'INTEGRATION':
          output = await this.executeIntegration(node, input, config, logs)
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
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    // Automation can trigger external systems, send emails, etc.
    const automationType = config.automationType || 'default'

    switch (automationType) {
      case 'webhook':
        return await this.callWebhook(config.webhookUrl, input, logs)
      case 'email':
        return await this.sendEmail(config.emailConfig, input, logs)
      case 'notification':
        return await this.sendNotification(config.notificationConfig, input, logs)
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
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    const integrationType = config.integrationType || 'default'

    switch (integrationType) {
      case 'api':
        return await this.callAPI(config.apiConfig, input, logs)
      case 'database':
        return await this.queryDatabase(config.dbConfig, input, logs)
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
    try {
      let evaluated = condition
      for (const [key, value] of Object.entries(context)) {
        evaluated = evaluated.replace(
          new RegExp(`\\$\\{${key}\\}`, 'g'),
          String(value)
        )
      }
      // Simple evaluation (in production, use a safer method)
      return Boolean(eval(evaluated))
    } catch {
      return false
    }
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
    url: string,
    data: any,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'info',
      message: `Calling webhook: ${url}`,
    })

    // TODO: Implement actual webhook call
    return { success: true, data }
  }

  private static async sendEmail(
    config: any,
    data: any,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    logs.push({
      timestamp: new Date(),
      nodeId: '',
      nodeLabel: '',
      level: 'info',
      message: 'Sending email',
    })

    // TODO: Implement email sending
    return { success: true }
  }

  private static async sendNotification(
    config: any,
    data: any,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    // TODO: Implement notification
    return { success: true }
  }

  private static async callAPI(
    config: any,
    data: any,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    // TODO: Implement API call
    return { success: true, data }
  }

  private static async queryDatabase(
    config: any,
    data: any,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    // TODO: Implement database query
    return { success: true, data: [] }
  }

  private static async processFile(
    config: any,
    data: any,
    logs: ExecutionLogEntry[]
  ): Promise<any> {
    // TODO: Implement file processing
    return { success: true, data }
  }
}


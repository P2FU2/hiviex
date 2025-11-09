/**
 * Condition Node Processor
 * 
 * Executa nós do tipo CONDITION (if/else, switches)
 */

import { FlowContext, NodeExecutionResult, ExecutionLogEntry } from '../execution-engine'

interface FlowNode {
  id: string
  type: string
  label: string
  config?: any
}

export class ConditionProcessor {
  static async execute(
    node: FlowNode,
    context: FlowContext
  ): Promise<NodeExecutionResult> {
    const logs: ExecutionLogEntry[] = []
    const startTime = Date.now()

    try {
      const config = (node.config || {}) as Record<string, any>
      const input = this.getNodeInput(node, context)

      logs.push({
        timestamp: new Date(),
        nodeId: node.id,
        nodeLabel: node.label,
        level: 'info',
        message: 'Evaluating condition',
      })

      // Evaluate condition
      const conditionMet = this.evaluateCondition(
        config.condition || 'true',
        input
      )

      logs.push({
        timestamp: new Date(),
        nodeId: node.id,
        nodeLabel: node.label,
        level: conditionMet ? 'success' : 'info',
        message: `Condition ${conditionMet ? 'met' : 'not met'}`,
        data: { condition: config.condition, result: conditionMet },
      })

      // Return result with condition flag
      const output = {
        condition: conditionMet,
        input,
        ...(conditionMet ? config.then : config.else),
      }

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
        message: `Condition evaluation failed: ${errorMessage}`,
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
    for (const [nodeId, output] of context.nodeOutputs.entries()) {
      if (typeof output === 'object' && output !== null) {
        Object.assign(input, output)
      } else {
        input[nodeId] = output
      }
    }

    // Include global variables
    Object.assign(input, context.variables)

    return input
  }

  /**
   * Evaluate condition expression
   */
  private static evaluateCondition(
    condition: string,
    context: Record<string, any>
  ): boolean {
    try {
      // Replace variables in condition
      let evaluated = condition
      for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
        evaluated = evaluated.replace(regex, JSON.stringify(value))
      }

      // Also support dot notation
      evaluated = evaluated.replace(/\$\{([^}]+)\}/g, (match, path) => {
        const parts = path.split('.')
        let value: any = context
        for (const part of parts) {
          if (value && typeof value === 'object') {
            value = value[part]
          } else {
            return match
          }
        }
        return value !== undefined ? JSON.stringify(value) : match
      })

      // Evaluate as JavaScript expression
      // In production, use a safer evaluator like expr-eval
      return Boolean(eval(evaluated))
    } catch (error) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }
}


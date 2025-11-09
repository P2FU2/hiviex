/**
 * Flow Execution Engine
 * 
 * Engine similar a Kestra/ComfyUI para executar flows visuais
 * Suporta execução sequencial, paralela, condicionais e loops
 */

import { prisma } from '@/lib/db/prisma'
import { NodeType, ProcessType, ExecutionStatus } from '@prisma/client'
import { AgentProcessor } from './processors/agent-processor'
import { ProcessProcessor } from './processors/process-processor'
import { ConditionProcessor } from './processors/condition-processor'

interface FlowNode {
  id: string
  flowId: string
  type: NodeType
  agentId?: string | null
  processType?: ProcessType | null
  positionX: number
  positionY: number
  label: string
  config?: any
}

interface FlowConnection {
  id: string
  flowId: string
  sourceNodeId: string
  targetNodeId: string
  condition?: string | null
  config?: any
}

export interface FlowContext {
  executionId: string
  flowId: string
  variables: Record<string, any>
  nodeOutputs: Map<string, any>
  nodeErrors: Map<string, string>
  executionLog: ExecutionLogEntry[]
}

export interface ExecutionLogEntry {
  timestamp: Date
  nodeId: string
  nodeLabel: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  data?: any
}

export interface NodeExecutionResult {
  success: boolean
  output?: any
  error?: string
  logs: ExecutionLogEntry[]
  duration: number
}

export class FlowExecutionEngine {
  private context: FlowContext
  private nodes: Map<string, FlowNode>
  private connections: FlowConnection[]
  private executedNodes: Set<string> = new Set()
  private readyNodes: Set<string> = new Set()

  constructor(
    executionId: string,
    flowId: string,
    nodes: FlowNode[],
    connections: FlowConnection[]
  ) {
    this.context = {
      executionId,
      flowId,
      variables: {},
      nodeOutputs: new Map(),
      nodeErrors: new Map(),
      executionLog: [],
    }

    this.nodes = new Map(nodes.map((n) => [n.id, n]))
    this.connections = connections

    // Initialize ready nodes (nodes with no dependencies)
    this.initializeReadyNodes()
  }

  /**
   * Initialize nodes that are ready to execute (no dependencies)
   */
  private initializeReadyNodes() {
    const nodeIds = new Set(this.nodes.keys())
    const hasIncomingConnections = new Set(
      this.connections.map((c) => c.targetNodeId)
    )

    // Nodes without incoming connections are ready
    for (const nodeId of nodeIds) {
      if (!hasIncomingConnections.has(nodeId)) {
        this.readyNodes.add(nodeId)
      }
    }
  }

  /**
   * Add log entry
   */
  private log(
    nodeId: string,
    level: ExecutionLogEntry['level'],
    message: string,
    data?: any
  ) {
    const node = this.nodes.get(nodeId)
    this.context.executionLog.push({
      timestamp: new Date(),
      nodeId,
      nodeLabel: node?.label || nodeId,
      level,
      message,
      data,
    })
  }

  /**
   * Check if a node is ready to execute
   */
  private isNodeReady(nodeId: string): boolean {
    if (this.executedNodes.has(nodeId)) {
      return false
    }

    // Get all incoming connections
    const incomingConnections = this.connections.filter(
      (c) => c.targetNodeId === nodeId
    )

    // If no incoming connections, node is ready
    if (incomingConnections.length === 0) {
      return true
    }

    // Check if all source nodes have been executed successfully
    for (const conn of incomingConnections) {
      if (!this.executedNodes.has(conn.sourceNodeId)) {
        return false
      }
      // Check if source node has error
      if (this.context.nodeErrors.has(conn.sourceNodeId)) {
        return false
      }
      // Check condition if exists
      if (conn.condition) {
        const conditionMet = this.evaluateCondition(
          conn.condition,
          conn.sourceNodeId
        )
        if (!conditionMet) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Evaluate condition string
   */
  private evaluateCondition(condition: string, sourceNodeId: string): boolean {
    try {
      // Get output from source node
      const sourceOutput = this.context.nodeOutputs.get(sourceNodeId) || {}
      
      // Simple condition evaluation
      // Supports: ${variable}, ${output.field}, etc.
      let evaluatedCondition = condition
      
      // Replace variables
      evaluatedCondition = evaluatedCondition.replace(
        /\$\{([^}]+)\}/g,
        (match, path) => {
          const parts = path.split('.')
          let value: any = sourceOutput
          
          for (const part of parts) {
            if (value && typeof value === 'object') {
              value = value[part]
            } else {
              return match
            }
          }
          
          return value !== undefined ? String(value) : match
        }
      )

      // Evaluate as JavaScript expression (in production, use a safer evaluator)
      // For now, support simple comparisons
      if (evaluatedCondition.includes('==')) {
        const [left, right] = evaluatedCondition.split('==').map((s) => s.trim())
        return left === right
      }
      if (evaluatedCondition.includes('!=')) {
        const [left, right] = evaluatedCondition.split('!=').map((s) => s.trim())
        return left !== right
      }
      if (evaluatedCondition.includes('>')) {
        const [left, right] = evaluatedCondition.split('>').map((s) => s.trim())
        return Number(left) > Number(right)
      }
      if (evaluatedCondition.includes('<')) {
        const [left, right] = evaluatedCondition.split('<').map((s) => s.trim())
        return Number(left) < Number(right)
      }

      // Default: truthy check
      return Boolean(evaluatedCondition)
    } catch (error) {
      this.log(sourceNodeId, 'error', `Error evaluating condition: ${error}`)
      return false
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: string): Promise<NodeExecutionResult> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return {
        success: false,
        error: `Node ${nodeId} not found`,
        logs: [],
        duration: 0,
      }
    }

    const startTime = Date.now()
    this.log(nodeId, 'info', `Executing node: ${node.label}`)

    try {
      let result: NodeExecutionResult

      switch (node.type) {
        case 'AGENT':
          result = await AgentProcessor.execute(node, this.context)
          break
        case 'PROCESS':
          result = await ProcessProcessor.execute(node, this.context)
          break
        case 'CONDITION':
          result = await ConditionProcessor.execute(node, this.context)
          break
        case 'TRIGGER':
          // Trigger nodes are usually entry points, just pass through
          result = {
            success: true,
            output: this.context.variables,
            logs: [],
            duration: 0,
          }
          break
        case 'INTEGRATION':
          // Integration nodes (webhooks, APIs, etc.)
          result = await ProcessProcessor.execute(node, this.context)
          break
        default:
          result = {
            success: false,
            error: `Unknown node type: ${node.type}`,
            logs: [],
            duration: 0,
          }
      }

      const duration = Date.now() - startTime

      // Store output
      if (result.success && result.output !== undefined) {
        this.context.nodeOutputs.set(nodeId, result.output)
        this.log(nodeId, 'success', `Node executed successfully`, {
          output: result.output,
          duration,
        })
      } else if (result.error) {
        this.context.nodeErrors.set(nodeId, result.error)
        this.log(nodeId, 'error', `Node execution failed: ${result.error}`)
      }

      // Merge logs
      this.context.executionLog.push(...result.logs)

      return {
        ...result,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.context.nodeErrors.set(nodeId, errorMessage)
      this.log(nodeId, 'error', `Unexpected error: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
        logs: [],
        duration,
      }
    }
  }

  /**
   * Get next nodes to execute (nodes that are ready)
   */
  private getReadyNodes(): string[] {
    const ready: string[] = []

    for (const nodeId of this.nodes.keys()) {
      if (this.isNodeReady(nodeId)) {
        ready.push(nodeId)
      }
    }

    return ready
  }

  /**
   * Get nodes that depend on a completed node
   */
  private getDependentNodes(nodeId: string): string[] {
    return this.connections
      .filter((c) => c.sourceNodeId === nodeId)
      .map((c) => c.targetNodeId)
  }

  /**
   * Execute flow
   */
  async execute(input: Record<string, any> = {}): Promise<{
    success: boolean
    output?: any
    logs: ExecutionLogEntry[]
    nodeResults: Map<string, NodeExecutionResult>
  }> {
    // Initialize context with input
    this.context.variables = { ...input }

    this.log('', 'info', 'Flow execution started', { input })

    const nodeResults = new Map<string, NodeExecutionResult>()
    let hasProgress = true
    const maxIterations = 1000 // Prevent infinite loops
    let iterations = 0

    while (hasProgress && iterations < maxIterations) {
      iterations++
      hasProgress = false

      // Get all ready nodes
      const readyNodes = this.getReadyNodes()

      if (readyNodes.length === 0) {
        // Check if we're done or stuck
        if (this.executedNodes.size === this.nodes.size) {
          // All nodes executed
          break
        } else {
          // Check if there are nodes with errors that block execution
          const remainingNodes = Array.from(this.nodes.keys()).filter(
            (id) => !this.executedNodes.has(id)
          )
          const hasBlockedNodes = remainingNodes.some((id) => {
            const incoming = this.connections.filter((c) => c.targetNodeId === id)
            return incoming.some((c) => this.context.nodeErrors.has(c.sourceNodeId))
          })

          if (hasBlockedNodes) {
            this.log('', 'error', 'Flow execution blocked by errors')
            break
          }
        }
      }

      // Execute ready nodes (can be parallel)
      const executionPromises = readyNodes.map(async (nodeId) => {
        const result = await this.executeNode(nodeId)
        nodeResults.set(nodeId, result)
        this.executedNodes.add(nodeId)
        hasProgress = true

        // Update ready nodes for dependent nodes
        const dependents = this.getDependentNodes(nodeId)
        for (const dependentId of dependents) {
          if (this.isNodeReady(dependentId)) {
            this.readyNodes.add(dependentId)
          }
        }
      })

      await Promise.all(executionPromises)
    }

    if (iterations >= maxIterations) {
      this.log('', 'error', 'Flow execution stopped: max iterations reached')
    }

    // Collect final output from nodes without outgoing connections
    const outputNodes = Array.from(this.nodes.keys()).filter(
      (nodeId) =>
        !this.connections.some((c) => c.sourceNodeId === nodeId) &&
        this.executedNodes.has(nodeId) &&
        !this.context.nodeErrors.has(nodeId)
    )

    const finalOutput: any = {}
    for (const nodeId of outputNodes) {
      const output = this.context.nodeOutputs.get(nodeId)
      if (output) {
        finalOutput[nodeId] = output
      }
    }

    const success =
      this.executedNodes.size === this.nodes.size &&
      this.context.nodeErrors.size === 0

    this.log('', success ? 'success' : 'error', 'Flow execution completed', {
      executed: this.executedNodes.size,
      total: this.nodes.size,
      errors: this.context.nodeErrors.size,
    })

    return {
      success,
      output: finalOutput,
      logs: this.context.executionLog,
      nodeResults,
    }
  }

  /**
   * Get execution context (for debugging)
   */
  getContext(): FlowContext {
    return { ...this.context }
  }
}


/**
 * Flow Validators
 * 
 * Validações para flows e execuções
 */

interface FlowNode {
  id: string
  type: string
  agentId?: string | null
  label: string
}

interface FlowConnection {
  sourceNodeId: string
  targetNodeId: string
}

export interface FlowValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate flow before execution
 */
export function validateFlow(
  nodes: FlowNode[],
  connections: FlowConnection[]
): FlowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if flow has nodes
  if (nodes.length === 0) {
    errors.push('Flow deve ter pelo menos um nó')
  }

  // Check for orphaned nodes (nodes without connections)
  const connectedNodeIds = new Set<string>()
  connections.forEach((conn) => {
    connectedNodeIds.add(conn.sourceNodeId)
    connectedNodeIds.add(conn.targetNodeId)
  })

  const orphanedNodes = nodes.filter(
    (node) =>
      !connectedNodeIds.has(node.id) &&
      !connections.some((c) => c.targetNodeId === node.id)
  )

  if (orphanedNodes.length > 0 && nodes.length > 1) {
    warnings.push(
      `${orphanedNodes.length} nó(s) não conectado(s): ${orphanedNodes.map((n) => n.label).join(', ')}`
    )
  }

  // Check for agent nodes without agentId
  const agentNodesWithoutAgent = nodes.filter(
    (node) => node.type === 'AGENT' && !node.agentId
  )
  if (agentNodesWithoutAgent.length > 0) {
    errors.push(
      `${agentNodesWithoutAgent.length} nó(s) agente sem agente selecionado: ${agentNodesWithoutAgent.map((n) => n.label).join(', ')}`
    )
  }

  // Check for circular dependencies
  const hasCycle = checkCircularDependency(nodes, connections)
  if (hasCycle) {
    errors.push('Flow contém dependências circulares')
  }

  // Check for nodes without incoming connections (entry points)
  const entryPoints = nodes.filter(
    (node) => !connections.some((c) => c.targetNodeId === node.id)
  )
  if (entryPoints.length === 0 && nodes.length > 1) {
    warnings.push('Nenhum ponto de entrada encontrado (todos os nós têm conexões de entrada)')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check for circular dependencies in flow
 */
function checkCircularDependency(
  nodes: FlowNode[],
  connections: FlowConnection[]
): boolean {
  const graph = new Map<string, string[]>()
  nodes.forEach((node) => {
    graph.set(node.id, [])
  })
  connections.forEach((conn) => {
    const neighbors = graph.get(conn.sourceNodeId) || []
    neighbors.push(conn.targetNodeId)
    graph.set(conn.sourceNodeId, neighbors)
  })

  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) return true
    }
  }

  return false
}

/**
 * Validate node configuration
 */
export function validateNodeConfig(node: FlowNode): FlowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!node.label || node.label.trim().length === 0) {
    errors.push('Nó deve ter um nome')
  }

  if (node.type === 'AGENT' && !node.agentId) {
    errors.push('Nó agente deve ter um agente selecionado')
  }

  if (node.type === 'PROCESS' && !node.processType) {
    errors.push('Nó processo deve ter um tipo definido')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}


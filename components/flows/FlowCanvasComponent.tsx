/**
 * Flow Canvas Component - Shared component for both [id] and new routes
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
  NodeMouseHandler,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Bot, Settings, Play, Save, Plus, Trash2, X, GitBranch, History, Layout, Instagram, FileText, Eye, ChevronDown } from 'lucide-react'
import AgentNode from '@/components/flows/AgentNode'
import ProcessNode from '@/components/flows/ProcessNode'
import PanelNode from '@/components/flows/PanelNode'
import SocialAccountNode from '@/components/flows/SocialAccountNode'
import ContextNode from '@/components/flows/ContextNode'
import VisualizationNode from '@/components/flows/VisualizationNode'
import ShapeNode from '@/components/flows/ShapeNode'
import NodeConfigPanel from '@/components/flows/NodeConfigPanel'
import ContextMenu from '@/components/flows/ContextMenu'
import Link from 'next/link'

const nodeTypes = {
  agent: AgentNode,
  process: ProcessNode,
  panel: PanelNode,
  social: SocialAccountNode,
  context: ContextNode,
  visualization: VisualizationNode,
  shape: ShapeNode,
}

interface FlowCanvasComponentProps {
  flowId: string
}

export default function FlowCanvasComponent({ flowId }: FlowCanvasComponentProps) {
  const router = useRouter()
  const reactFlowInstance = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [flowName, setFlowName] = useState('Novo Flow')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ node: Node | null; position: { x: number; y: number } } | null>(null)
  const [copiedNode, setCopiedNode] = useState<Node | null>(null)
  const [isPanOnDrag, setIsPanOnDrag] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)

  // Load flow data and agents
  useEffect(() => {
    loadAgents()
    if (flowId && flowId !== 'new') {
      loadFlow()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for pan mode
      if (e.code === 'Space' && !e.repeat) {
        setIsPanOnDrag(true)
        document.body.style.cursor = 'grab'
      }

      // Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        // Copy
        if (e.key === 'c' && selectedNode) {
          e.preventDefault()
          setCopiedNode(selectedNode)
        }
        // Paste
        if (e.key === 'v' && copiedNode) {
          e.preventDefault()
          handlePasteNode()
        }
        // Duplicate
        if (e.key === 'd' && selectedNode) {
          e.preventDefault()
          handleDuplicateNode()
        }
        // Select all
        if (e.key === 'a') {
          e.preventDefault()
          setSelectedNodes(new Set(nodes.map((n) => n.id)))
        }
        // Save
        if (e.key === 's') {
          e.preventDefault()
          handleSave()
        }
      }

      // Delete
      if (e.key === 'Delete' && selectedNode) {
        e.preventDefault()
        handleDeleteNode()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanOnDrag(false)
        document.body.style.cursor = 'default'
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedNode, copiedNode, nodes])

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  const loadFlow = async () => {
    try {
      if (!flowId || flowId === 'new') {
        setIsLoading(false)
        return
      }
      
      const response = await fetch(`/api/flows/${flowId}`)
      if (!response.ok) throw new Error('Failed to load flow')
      
      const data = await response.json()
      
      setFlowName(data.name || 'Sem nome')
      
      // Convert database nodes to ReactFlow nodes
      const flowNodes: Node[] = data.nodes.map((node: any) => {
        const config = node.config || {}
        let nodeType = 'process'
        if (node.type === 'AGENT') nodeType = 'agent'
        else if (node.type === 'PROCESS') {
          // Check config to determine if it's a panel, social, context, visualization, or shape
          if (config.type === 'panel') nodeType = 'panel'
          else if (config.type === 'social') nodeType = 'social'
          else if (config.type === 'context') nodeType = 'context'
          else if (config.type === 'visualization') nodeType = 'visualization'
          else if (config.type === 'shape') nodeType = 'shape'
        }
        
        return {
          id: node.id,
          type: nodeType,
          position: { x: node.positionX || 0, y: node.positionY || 0 },
          data: {
            label: node.label || 'Sem nome',
            agentId: node.agentId,
            processType: node.processType,
            description: config.description,
            content: config.content,
            inputs: config.inputs || [],
            outputs: config.outputs || [],
            parameters: config.parameters || {},
            visualizationType: config.visualizationType,
            panelType: config.panelType,
            connectionType: config.connectionType,
            platform: config.platform,
            accountName: config.accountName,
            color: config.color,
            opacity: config.opacity,
            width: config.width,
            height: config.height,
            text: config.text,
            config: config,
          },
        }
      })
      
      // Convert database connections to ReactFlow edges
      const flowEdges: Edge[] = data.connections.map((conn: any) => ({
        id: `e${conn.sourceNodeId}-${conn.targetNodeId}`,
        source: conn.sourceNodeId,
        target: conn.targetNodeId,
        sourceHandle: conn.config?.sourceHandle,
        targetHandle: conn.config?.targetHandle,
        label: conn.condition || undefined,
        animated: true,
        data: {
          condition: conn.condition,
          connectionType: conn.config?.connectionType || 'default',
          config: conn.config,
        },
      }))
      
      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (error) {
      console.error('Error loading flow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) => addEdge(params, eds))
    },
    [setEdges]
  )

  const handleSave = async () => {
    if (!flowName.trim()) {
      alert('Por favor, insira um nome para o flow')
      return
    }

    setIsSaving(true)
    try {
      const flowData = {
        name: flowName.trim(),
        description: null,
        nodes: nodes.map((node) => {
          let dbType = 'PROCESS'
          if (node.type === 'agent') dbType = 'AGENT'
          
          const config: any = {
            ...(node.data.config || {}),
            type: node.type,
            description: node.data.description,
            content: node.data.content,
            inputs: node.data.inputs,
            outputs: node.data.outputs,
            parameters: node.data.parameters,
            visualizationType: node.data.visualizationType,
          }
          
          if (node.type === 'panel') {
            config.panelType = node.data.panelType
            config.connectionType = node.data.connectionType
          } else if (node.type === 'social') {
            config.platform = node.data.platform
            config.accountName = node.data.accountName
            config.connectionType = node.data.connectionType
          } else if (node.type === 'shape') {
            config.color = node.data.color
            config.opacity = node.data.opacity
            config.width = node.data.width
            config.height = node.data.height
            config.text = node.data.text
          }

          return {
            type: dbType,
            positionX: node.position.x,
            positionY: node.position.y,
            label: node.data.label || 'Sem nome',
            agentId: node.data.agentId || null,
            processType: node.data.processType || null,
            config,
          }
        }),
        connections: edges.map((edge) => ({
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          condition: edge.label || null,
          config: {
            ...(edge.data?.config || {}),
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            connectionType: edge.data?.connectionType || 'default',
          },
        })),
      }

      const url = flowId === 'new' ? '/api/flows' : `/api/flows/${flowId}`
      const method = flowId === 'new' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save flow')
      }

      const savedFlow = await response.json()
      if (flowId === 'new') {
        router.push(`/dashboard/flows/${savedFlow.id}`)
      } else {
        setIsSaving(false)
        alert('Flow salvo com sucesso!')
      }
    } catch (error) {
      console.error('Error saving flow:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar flow')
      setIsSaving(false)
    }
  }

  const handleAddNode = (type: string) => {
    const position = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: type === 'agent' ? 'Novo Agente' : type === 'process' ? 'Novo Processo' : type === 'panel' ? 'Novo Painel' : type === 'social' ? 'Nova Conta Social' : type === 'context' ? 'Novo Contexto' : type === 'shape' ? 'Nova Forma' : 'Nova Visualização',
        agentId: null,
        processType: null,
        description: '',
        content: '',
        inputs: type === 'process' ? [{ id: 'input-1', name: 'Input 1', type: 'text' }] : [],
        outputs: type === 'process' ? [{ id: 'output-1', name: 'Output 1', type: 'text' }] : [],
        parameters: {},
        visualizationType: type === 'visualization' ? 'chart' : undefined,
        panelType: type === 'panel' ? 'mindmap' : undefined,
        connectionType: type === 'panel' || type === 'social' ? 'default' : undefined,
        platform: type === 'social' ? 'instagram' : undefined,
        accountName: type === 'social' ? '' : undefined,
        color: type === 'shape' ? '#3b82f6' : undefined,
        opacity: type === 'shape' ? 0.3 : undefined,
        width: type === 'shape' ? 300 : undefined,
        height: type === 'shape' ? 200 : undefined,
        text: type === 'shape' ? '' : undefined,
        config: {},
      },
    }

    setNodes((nds: Node[]) => [...nds, newNode])
  }

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setShowConfigPanel(true)
  }

  const handleNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setContextMenu({
      node,
      position: { x: event.clientX, y: event.clientY },
    })
  }

  const handleDeleteNode = () => {
    if (selectedNode) {
      setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== selectedNode.id))
      setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.source !== selectedNode.id && e.target !== selectedNode.id))
      setSelectedNode(null)
      setShowConfigPanel(false)
    }
  }

  const handleDuplicateNode = () => {
    if (selectedNode) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      })

      const newNode: Node = {
        ...selectedNode,
        id: `${selectedNode.type}-${Date.now()}`,
        position,
      }

      setNodes((nds: Node[]) => [...nds, newNode])
    }
  }

  const handlePasteNode = () => {
    if (copiedNode) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })

      const newNode: Node = {
        ...copiedNode,
        id: `${copiedNode.type}-${Date.now()}`,
        position,
      }

      setNodes((nds: Node[]) => [...nds, newNode])
    }
  }

  const handleConvertNode = (newType: string) => {
    if (selectedNode) {
      setNodes((nds: Node[]) =>
        nds.map((n: Node) =>
          n.id === selectedNode.id
            ? {
                ...n,
                type: newType,
                data: {
                  ...n.data,
                  // Reset type-specific data
                  inputs: newType === 'process' ? n.data.inputs || [] : [],
                  outputs: newType === 'process' ? n.data.outputs || [] : [],
                  visualizationType: newType === 'visualization' ? 'chart' : undefined,
                },
              }
            : n
        )
      )
      setContextMenu(null)
    }
  }

  const handleNodeConfigSave = (updatedNode: Node) => {
    setNodes((nds: Node[]) => nds.map((n: Node) => (n.id === updatedNode.id ? updatedNode : n)))
    setShowConfigPanel(false)
    setSelectedNode(null)
  }

  const handleExecute = async () => {
    if (flowId === 'new') {
      alert('Salve o flow antes de executar')
      return
    }

    try {
      const response = await fetch(`/api/flows/${flowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      })

      if (!response.ok) throw new Error('Failed to execute flow')

      alert('Flow executado com sucesso!')
      router.push(`/dashboard/flows/executions`)
    } catch (error) {
      console.error('Error executing flow:', error)
      alert('Erro ao executar flow')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando Flow Builder...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/flows"
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </Link>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="text-xl font-bold bg-transparent border-none outline-none text-black dark:text-white px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              placeholder="Nome do Flow"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecute}
              disabled={flowId === 'new'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Executar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="absolute inset-0 top-[73px] bg-black">
        <ReactFlow
          nodes={nodes.map(node => {
            // Shape nodes should have lower z-index to stay behind other nodes
            if (node.type === 'shape') {
              return {
                ...node,
                style: { ...node.style, zIndex: -1 },
                zIndex: -1,
              }
            }
            return node
          })}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          nodeTypes={{
            ...nodeTypes,
            shape: (props: any) => (
              <ShapeNode
                {...props}
                onUpdate={(id, updates) => {
                  setNodes((nds: Node[]) =>
                    nds.map((n: Node) =>
                      n.id === id ? { ...n, data: { ...n.data, ...updates } } : n
                    )
                  )
                }}
              />
            ),
          }}
          fitView
          panOnDrag={isPanOnDrag}
          className="bg-black"
        >
        <Background color="#333" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node: Node) => {
            if (node.type === 'agent') return '#3b82f6'
            if (node.type === 'process') return '#8b5cf6'
            if (node.type === 'panel') return '#10b981'
            if (node.type === 'social') return '#ec4899'
            if (node.type === 'context') return '#f59e0b'
            if (node.type === 'visualization') return '#06b6d4'
            return '#6b7280'
          }}
        />

        {/* Top Right Panel - Add Nodes Menu (Always Visible, Collapsible) */}
        <Panel position="top-right" className="z-10">
          <div className="bg-white/95 dark:bg-black/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200/50 dark:border-white/10">
              <h3 className="text-sm font-semibold text-black dark:text-white px-2">Adicionar</h3>
              <button
                onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
              >
                <ChevronDown className={`w-4 h-4 text-black dark:text-white transition-transform ${isMenuCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {/* Menu items */}
            {!isMenuCollapsed && (
              <div className="p-2 space-y-1 min-w-[200px]">
                <button
                  onClick={() => handleAddNode('shape')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <div className="w-4 h-4 border-2 border-white rounded" />
                  Forma
                </button>
                <button
                  onClick={() => handleAddNode('context')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Contexto
                </button>
                <button
                  onClick={() => handleAddNode('process')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  Processo
                </button>
                <button
                  onClick={() => handleAddNode('visualization')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Visualização
                </button>
                <button
                  onClick={() => handleAddNode('agent')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Bot className="w-4 h-4" />
                  Agente
                </button>
                <button
                  onClick={() => handleAddNode('panel')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                >
                  <Layout className="w-4 h-4" />
                  Painel
                </button>
                <button
                  onClick={() => handleAddNode('social')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                >
                  <Instagram className="w-4 h-4" />
                  Rede Social
                </button>
              </div>
            )}
          </div>
        </Panel>

        {/* Bottom Left Panel - Stats */}
        <Panel position="bottom-left" className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-600" />
              <span className="text-gray-600 dark:text-gray-400">Contexto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <span className="text-gray-600 dark:text-gray-400">Processo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-600" />
              <span className="text-gray-600 dark:text-gray-400">Visualização</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-gray-600 dark:text-gray-400">Agente</span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">
              • {nodes.length} cards • {edges.length} conexões
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Espaço = Pan • Ctrl+D = Duplicar • Delete = Remover
            </span>
          </div>
        </Panel>
        </ReactFlow>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <ContextMenu
            node={contextMenu.node}
            position={contextMenu.position}
            onClose={() => setContextMenu(null)}
            onDuplicate={handleDuplicateNode}
            onDelete={handleDeleteNode}
            onConvert={handleConvertNode}
            onAddComment={() => {
              setContextMenu(null)
            }}
            onGroup={() => {
              setContextMenu(null)
            }}
          />
        </>
      )}

      {/* Node Config Panel */}
      {showConfigPanel && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          agents={agents}
          onSave={handleNodeConfigSave}
          onClose={() => {
            setShowConfigPanel(false)
            setSelectedNode(null)
          }}
        />
      )}
    </div>
  )
}


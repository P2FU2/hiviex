/**
 * Agent Node Component
 * Custom node for ReactFlow representing an Agent
 */

'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Bot } from 'lucide-react'

interface AgentNodeData {
  label: string
  agentId?: string | null
  config?: any
}

function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white dark:bg-black ${
        selected
          ? 'border-blue-500 dark:border-blue-400'
          : 'border-gray-300 dark:border-gray-700'
      } min-w-[200px]`}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-black dark:text-white text-sm">
            {data.label}
          </div>
          {data.agentId && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              ID: {data.agentId}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(AgentNode)


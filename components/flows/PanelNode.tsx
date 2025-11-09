/**
 * Panel Node Component
 * 
 * Nó tipo painel para o Flow Builder (mind map style)
 */

'use client'

import { Handle, Position } from 'reactflow'
import { Layout, Settings } from 'lucide-react'

interface PanelNodeData {
  label: string
  type: 'panel' | 'social' | 'integration'
  config?: any
}

export default function PanelNode({ data }: { data: PanelNodeData }) {
  const getPanelColor = () => {
    switch (data.type) {
      case 'social':
        return 'bg-blue-500'
      case 'integration':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="px-4 py-3 bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg min-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getPanelColor()}`} />
        <Layout className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>
      
      <div className="font-semibold text-sm text-black dark:text-white mb-1">
        {data.label}
      </div>
      
      {data.type && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {data.type}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}


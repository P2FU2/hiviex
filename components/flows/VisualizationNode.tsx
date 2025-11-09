/**
 * Visualization Node Component
 * 
 * Card de VISUALIZAÇÃO - exibe resultado, logs ou prévia
 */

'use client'

import { Handle, Position } from 'reactflow'
import { Eye, Terminal, Image as ImageIcon } from 'lucide-react'

interface VisualizationNodeData {
  label: string
  description?: string
  visualizationType?: 'preview' | 'logs' | 'result'
  content?: string
  config?: any
}

export default function VisualizationNode({ data }: { data: VisualizationNodeData }) {
  const visType = data.visualizationType || 'preview'
  
  const icons = {
    preview: ImageIcon,
    logs: Terminal,
    result: Eye,
  }
  
  const Icon = icons[visType] || Eye

  return (
    <div className="px-4 py-3 bg-white dark:bg-black border-2 border-green-300 dark:border-green-700 rounded-lg shadow-lg min-w-[250px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-green-600 dark:text-green-400" />
        <div className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-green-800 dark:text-green-200 font-medium">
          VISUALIZAÇÃO
        </div>
        <div className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 capitalize">
          {visType}
        </div>
      </div>
      
      <div className="font-semibold text-sm text-black dark:text-white mb-1">
        {data.label}
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {data.description}
        </div>
      )}
      
      {data.content && (
        <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto font-mono">
          {data.content}
        </div>
      )}

      {!data.content && (
        <div className="text-xs text-gray-500 dark:text-gray-500 italic p-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded">
          Aguardando dados...
        </div>
      )}
    </div>
  )
}


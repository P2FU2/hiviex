/**
 * Context Node Component
 * 
 * Card de CONTEXTO - somente texto/organização, sem processamento
 */

'use client'

import { Handle, Position } from 'reactflow'
import { FileText } from 'lucide-react'

interface ContextNodeData {
  label: string
  description?: string
  content?: string
  config?: any
}

export default function ContextNode({ data }: { data: ContextNodeData }) {
  return (
    <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg shadow-lg min-w-[200px] max-w-[300px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        <div className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded text-yellow-800 dark:text-yellow-200 font-medium">
          CONTEXTO
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
        <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-black p-2 rounded border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
          {data.content}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}


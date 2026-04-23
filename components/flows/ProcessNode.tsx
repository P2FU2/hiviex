/**
 * Process Node Component
 * 
 * Card de PROCESSO - inputs → função → outputs
 */

'use client'

import { Handle, Position } from 'reactflow'
import { Settings, ArrowRight } from 'lucide-react'

interface ProcessNodeData {
  label: string
  description?: string
  inputs?: Array<{ id: string; name: string; type: string }>
  outputs?: Array<{ id: string; name: string; type: string }>
  parameters?: Record<string, any>
  config?: any
}

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  json: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  image: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  latent: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  number: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
}

export default function ProcessNode({ data }: { data: ProcessNodeData }) {
  const inputs = data.inputs || []
  const outputs = data.outputs || []

  return (
    <div className="min-w-[250px] rounded-xl border-2 border-violet-400/50 bg-[var(--surface-elevated)]/95 px-4 py-3 shadow-md backdrop-blur-sm dark:border-violet-500/40">
      {/* Input Handles */}
      {inputs.map((input, idx) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className="!h-2.5 !w-2.5 !border-2 !border-violet-500 !bg-violet-100 dark:!bg-violet-900"
          style={{
            top: `${24 + idx * 28}px`,
          }}
        />
      ))}
      
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <div className="rounded bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-200">
          PROCESSO
        </div>
      </div>
      
      <div className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
        {data.label}
      </div>
      
      {data.description && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {data.description}
        </div>
      )}

      {/* Inputs */}
      {inputs.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Inputs:
          </div>
          <div className="space-y-1">
            {inputs.map((input) => (
              <div
                key={input.id}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className={`px-2 py-0.5 rounded ${TYPE_COLORS[input.type] || TYPE_COLORS.default}`}
                >
                  {input.type}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{input.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arrow */}
      {inputs.length > 0 && outputs.length > 0 && (
        <div className="flex justify-center my-2">
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Outputs */}
      {outputs.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Outputs:
          </div>
          <div className="space-y-1">
            {outputs.map((output) => (
              <div
                key={output.id}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className={`px-2 py-0.5 rounded ${TYPE_COLORS[output.type] || TYPE_COLORS.default}`}
                >
                  {output.type}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{output.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output Handles */}
      {outputs.map((output, idx) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className="!h-2.5 !w-2.5 !border-2 !border-violet-500 !bg-violet-100 dark:!bg-violet-900"
          style={{
            top: `${24 + idx * 28}px`,
          }}
        />
      ))}
    </div>
  )
}

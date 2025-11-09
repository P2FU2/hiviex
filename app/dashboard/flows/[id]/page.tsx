/**
 * Flow Builder Canvas Page - ComfyUI Style
 * 
 * Sistema de workflow visual baseado em cards conectáveis
 */

'use client'

import { useParams } from 'next/navigation'
import { ReactFlowProvider } from 'reactflow'
import FlowCanvasComponent from '@/components/flows/FlowCanvasComponent'

export default function FlowCanvasPage() {
  const params = useParams()
  const flowId = params.id as string

  return (
    <ReactFlowProvider>
      <FlowCanvasComponent flowId={flowId} />
    </ReactFlowProvider>
  )
}

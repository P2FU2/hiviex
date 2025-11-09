/**
 * New Flow Page - Renders the canvas with id='new'
 */

'use client'

import { ReactFlowProvider } from 'reactflow'
import FlowCanvasComponent from '@/components/flows/FlowCanvasComponent'

export default function NewFlowPage() {
  return (
    <ReactFlowProvider>
      <FlowCanvasComponent flowId="new" />
    </ReactFlowProvider>
  )
}

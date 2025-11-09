/**
 * Shape Node Component
 * 
 * Nó tipo forma (quadrado) que fica atrás dos outros itens
 * Pode ser redimensionado, ter cor e opacidade customizadas, e funcionar como bloco de notas
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Handle, Position } from 'reactflow'

interface ShapeNodeData {
  label: string
  color?: string
  opacity?: number
  width?: number
  height?: number
  text?: string
  config?: any
}

interface ShapeNodeProps {
  data: ShapeNodeData
  selected?: boolean
  id?: string
  onUpdate?: (id: string, updates: Partial<ShapeNodeData>) => void
}

export default function ShapeNode({ data, selected, id, onUpdate }: ShapeNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(data.text || data.config?.text || '')
  const [color, setColor] = useState(data.color || data.config?.color || '#3b82f6')
  const [opacity, setOpacity] = useState(data.opacity ?? data.config?.opacity ?? 0.3)
  const [width, setWidth] = useState(data.width || data.config?.width || 300)
  const [height, setHeight] = useState(data.height || data.config?.height || 200)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const resizeStartPos = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  // Save changes when they occur (debounced to avoid too many updates)
  useEffect(() => {
    if (id && onUpdate) {
      const timeoutId = setTimeout(() => {
        onUpdate(id, { text, color, opacity, width, height })
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [text, color, opacity, width, height, id, onUpdate])

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (nodeRef.current) {
      resizeStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: width,
        height: height,
      }
    }
    setIsResizing(true)
    setResizeHandle(handle)
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeHandle || !resizeStartPos.current) return

      const deltaX = e.clientX - resizeStartPos.current.x
      const deltaY = e.clientY - resizeStartPos.current.y

      switch (resizeHandle) {
        case 'se': // Southeast (bottom-right)
          setWidth(Math.max(100, resizeStartPos.current.width + deltaX))
          setHeight(Math.max(100, resizeStartPos.current.height + deltaY))
          break
        case 'sw': // Southwest (bottom-left)
          setWidth(Math.max(100, resizeStartPos.current.width - deltaX))
          setHeight(Math.max(100, resizeStartPos.current.height + deltaY))
          break
        case 'ne': // Northeast (top-right)
          setWidth(Math.max(100, resizeStartPos.current.width + deltaX))
          setHeight(Math.max(100, resizeStartPos.current.height - deltaY))
          break
        case 'nw': // Northwest (top-left)
          setWidth(Math.max(100, resizeStartPos.current.width - deltaX))
          setHeight(Math.max(100, resizeStartPos.current.height - deltaY))
          break
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeHandle(null)
      resizeStartPos.current = null
    }


    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeHandle, width, height])

  return (
    <div
      ref={nodeRef}
      className="relative rounded-lg"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: color,
        opacity: opacity,
        zIndex: -1,
        minWidth: '100px',
        minHeight: '100px',
      }}
      onDoubleClick={() => setIsEditing(true)}
      onBlur={() => {
        if (!isResizing) {
          setIsEditing(false)
        }
      }}
    >
      {/* Resize handles */}
      {selected && (
        <>
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-blue-500 rounded cursor-se-resize"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-4 h-4 bg-white border-2 border-blue-500 rounded cursor-sw-resize"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute -top-1 -right-1 w-4 h-4 bg-white border-2 border-blue-500 rounded cursor-ne-resize"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute -top-1 -left-1 w-4 h-4 bg-white border-2 border-blue-500 rounded cursor-nw-resize"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
        </>
      )}

      {/* Text content */}
      <div className="w-full h-full p-4">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-white placeholder-white/50"
            placeholder="Digite suas notas aqui..."
            style={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          />
        ) : (
          <div
            className="w-full h-full text-white whitespace-pre-wrap overflow-auto"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            {text || 'Duplo clique para editar'}
          </div>
        )}
      </div>

      {/* Color and opacity controls (only when selected) */}
      {selected && (
        <div className="absolute top-2 right-2 bg-black/80 rounded-lg p-2 space-y-2 z-10">
          <div className="flex items-center gap-2">
            <label className="text-white text-xs">Cor:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-white text-xs">Opacidade:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-white text-xs w-8">{Math.round(opacity * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}


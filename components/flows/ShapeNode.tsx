/**
 * Nó "Forma" — notas ou região no canvas (não liga a outros nós; fica abaixo dos cards).
 */

'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { NodeProps } from 'reactflow'
import { StickyNote } from 'lucide-react'

type ShapeData = {
  label: string
  color?: string
  opacity?: number
  width?: number
  height?: number
  text?: string
  config?: { color?: string; opacity?: number; width?: number; height?: number; text?: string }
}

function ShapeNodeInner({
  data,
  selected,
  id,
  onUpdate,
}: {
  data: ShapeData
  selected?: boolean
  id: string
  onUpdate?: (id: string, updates: Partial<ShapeData>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(data.text || data.config?.text || '')
  const [color, setColor] = useState(data.color || data.config?.color || '#a78bfa')
  const [opacity, setOpacity] = useState(data.opacity ?? data.config?.opacity ?? 0.12)
  const [width, setWidth] = useState(data.width || data.config?.width || 280)
  const [height, setHeight] = useState(data.height || data.config?.height || 160)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const resizeStartPos = useRef<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) textareaRef.current.focus()
  }, [isEditing])

  useEffect(() => {
    if (id && onUpdate) {
      const t = setTimeout(() => {
        onUpdate(id, { text, color, opacity, width, height })
      }, 200)
      return () => clearTimeout(t)
    }
  }, [text, color, opacity, width, height, id, onUpdate])

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (nodeRef.current) {
      resizeStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        width,
        height,
      }
    }
    setIsResizing(true)
    setResizeHandle(handle)
  }

  useEffect(() => {
    if (!isResizing) return

    const move = (e: MouseEvent) => {
      if (!resizeHandle || !resizeStartPos.current) return
      const deltaX = e.clientX - resizeStartPos.current.x
      const deltaY = e.clientY - resizeStartPos.current.y
      switch (resizeHandle) {
        case 'se':
          setWidth(Math.max(120, resizeStartPos.current.width + deltaX))
          setHeight(Math.max(80, resizeStartPos.current.height + deltaY))
          break
        case 'sw':
          setWidth(Math.max(120, resizeStartPos.current.width - deltaX))
          setHeight(Math.max(80, resizeStartPos.current.height + deltaY))
          break
        case 'ne':
          setWidth(Math.max(120, resizeStartPos.current.width + deltaX))
          setHeight(Math.max(80, resizeStartPos.current.height - deltaY))
          break
        case 'nw':
          setWidth(Math.max(120, resizeStartPos.current.width - deltaX))
          setHeight(Math.max(80, resizeStartPos.current.height - deltaY))
          break
        default:
          break
      }
    }
    const up = () => {
      setIsResizing(false)
      setResizeHandle(null)
      resizeStartPos.current = null
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [isResizing, resizeHandle])

  const onDbl = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  return (
    <div
      ref={nodeRef}
      className={`relative overflow-hidden rounded-xl border-2 border-dashed shadow-sm transition-shadow ${
        selected
          ? 'border-violet-500 ring-2 ring-violet-500/20'
          : 'border-violet-400/50 dark:border-violet-500/35'
      }`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, var(--surface-elevated, white))`,
        zIndex: 0,
        minWidth: 120,
        minHeight: 80,
      }}
      onDoubleClick={onDbl}
    >
      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        <StickyNote className="h-3 w-3 text-violet-500" strokeWidth={2} />
        Área de notas
      </div>

      {selected ? (
        <>
          <div
            className="absolute -bottom-1 -right-1 z-20 h-3.5 w-3.5 cursor-se-resize rounded border-2 border-violet-500 bg-white dark:bg-zinc-900"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />
          <div
            className="absolute -bottom-1 -left-1 z-20 h-3.5 w-3.5 cursor-sw-resize rounded border-2 border-violet-500 bg-white dark:bg-zinc-900"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute -top-1 -right-1 z-20 h-3.5 w-3.5 cursor-ne-resize rounded border-2 border-violet-500 bg-white dark:bg-zinc-900"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute -top-1 -left-1 z-20 h-3.5 w-3.5 cursor-nw-resize rounded border-2 border-violet-500 bg-white dark:bg-zinc-900"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
        </>
      ) : null}

      <div
        className="h-full w-full p-3 pt-7"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              if (!isResizing) setIsEditing(false)
            }}
            className="h-[calc(100%-1.5rem)] w-full resize-none rounded border-0 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            placeholder="Notas, checklist, legenda do diagrama…"
            style={{ minHeight: '4rem' }}
          />
        ) : (
          <div
            className="h-[calc(100%-1.5rem)] w-full cursor-text overflow-auto text-sm leading-relaxed text-[var(--text-primary)]"
            onClick={() => setIsEditing(true)}
          >
            {text || (
              <span className="text-[var(--text-tertiary)]">Duplo clique para escrever</span>
            )}
          </div>
        )}
      </div>

      {selected ? (
        <div className="absolute right-2 top-2 z-20 space-y-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/95 p-2 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-tertiary)]">Cor</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-8 cursor-pointer rounded border border-[var(--border-subtle)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[10px] text-[var(--text-tertiary)]">Intensidade</span>
            <input
              type="range"
              min="0.04"
              max="0.45"
              step="0.02"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="w-6 text-right text-[10px] text-[var(--text-secondary)]">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ShapeNodeWrapper(
  props: NodeProps<ShapeData> & {
    onUpdate?: (id: string, updates: Partial<ShapeData>) => void
  }
) {
  const { onUpdate, id, data, selected } = props
  return (
    <ShapeNodeInner
      data={data}
      selected={selected}
      id={id}
      onUpdate={onUpdate}
    />
  )
}

export default memo(ShapeNodeWrapper)

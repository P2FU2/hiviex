/**
 * Context Menu Component
 * 
 * Menu contextual (botão direito) para cards
 */

'use client'

import { Copy, Trash2, FileText, Settings, Eye, Layers, MessageSquare, ArrowRight } from 'lucide-react'
import { Node } from 'reactflow'

interface ContextMenuProps {
  node: Node | null
  position: { x: number; y: number }
  onClose: () => void
  onDuplicate: () => void
  onDelete: () => void
  onConvert: (type: string) => void
  onAddComment: () => void
  onGroup: () => void
}

export default function ContextMenu({
  node,
  position,
  onClose,
  onDuplicate,
  onDelete,
  onConvert,
  onAddComment,
  onGroup,
}: ContextMenuProps) {
  if (!node) return null

  const menuItems = [
    {
      icon: Copy,
      label: 'Duplicar (Ctrl+D)',
      onClick: onDuplicate,
      shortcut: 'Ctrl+D',
    },
    {
      icon: ArrowRight,
      label: 'Converter para...',
      onClick: () => {},
      submenu: [
        { label: 'Contexto', onClick: () => onConvert('context') },
        { label: 'Processo', onClick: () => onConvert('process') },
        { label: 'Visualização', onClick: () => onConvert('visualization') },
      ],
    },
    {
      icon: MessageSquare,
      label: 'Adicionar Comentário',
      onClick: onAddComment,
    },
    {
      icon: Layers,
      label: 'Agrupar Cards',
      onClick: onGroup,
    },
    {
      icon: Trash2,
      label: 'Deletar (Delete)',
      onClick: onDelete,
      shortcut: 'Delete',
      danger: true,
    },
  ]

  return (
    <div
      className="fixed bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-2">
        {menuItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx}>
              <button
                onClick={() => {
                  item.onClick()
                  onClose()
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                  item.danger
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {item.shortcut}
                  </span>
                )}
              </button>
              {item.submenu && (
                <div className="ml-8 border-l border-gray-200 dark:border-white/10">
                  {item.submenu.map((sub, subIdx) => (
                    <button
                      key={subIdx}
                      onClick={() => {
                        sub.onClick()
                        onClose()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400"
                    >
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


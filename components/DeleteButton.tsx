/**
 * Delete Button Component
 * 
 * Reusable delete button with confirmation
 */

'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteButtonProps {
  onDelete: () => Promise<void>
  itemName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function DeleteButton({
  onDelete,
  itemName = 'item',
  className = '',
  size = 'md',
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      await onDelete()
      setShowConfirm(false)
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Erro ao deletar. Tente novamente.')
    } finally {
      setIsDeleting(false)
    }
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  if (showConfirm) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`${sizeClasses[size]} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isDeleting ? (
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
          ) : (
            <span className="text-xs">Confirmar</span>
          )}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`${sizeClasses[size]} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={`Deletar ${itemName}`}
    >
      {isDeleting ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        <Trash2 className={iconSizes[size]} />
      )}
    </button>
  )
}


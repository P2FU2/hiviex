/**
 * Danger Zone Component
 * 
 * Dangerous actions like deleting workspace
 */

'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DangerZoneProps {
  workspaceId: string
  workspaceName: string
}

export default function DangerZone({ workspaceId, workspaceName }: DangerZoneProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== workspaceName) {
      alert('O nome do workspace não confere. Digite exatamente: ' + workspaceName)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete workspace')
      }

      showNotification('Workspace deletado com sucesso!', 'success')
      setTimeout(() => {
        router.push('/dashboard/workspaces')
      }, 2000)
    } catch (error) {
      console.error('Error deleting workspace:', error)
      showNotification(error instanceof Error ? error.message : 'Erro ao deletar workspace', 'error')
      setIsDeleting(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white dark:bg-black rounded-lg border border-red-200 dark:border-red-800">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">
          Deletar Workspace
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          Esta ação não pode ser desfeita. Todos os dados, agentes, workflows e membros serão permanentemente removidos.
        </p>
        
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Deletar Workspace
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              Para confirmar, digite o nome do workspace: <strong>{workspaceName}</strong>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              placeholder={workspaceName}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setConfirmText('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== workspaceName}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar Deletar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


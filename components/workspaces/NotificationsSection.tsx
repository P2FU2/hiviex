/**
 * Notifications Section Component
 * 
 * Configure workspace notifications
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, Save, Loader2 } from 'lucide-react'

interface NotificationsSectionProps {
  workspaceId: string
}

export default function NotificationsSection({ workspaceId }: NotificationsSectionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    notifyOnNewMembers: true,
    notifyOnWorkflowExecutions: true,
    notifyOnAgentErrors: false,
  })

  useEffect(() => {
    loadNotifications()
  }, [workspaceId])

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notifications`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save notifications')
      }

      showNotification('Notificações salvas com sucesso!', 'success')
    } catch (error) {
      console.error('Error saving notifications:', error)
      showNotification(error instanceof Error ? error.message : 'Erro ao salvar notificações', 'error')
    } finally {
      setIsSaving(false)
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
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Configure as notificações do workspace
      </p>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifications.notifyOnNewMembers}
            onChange={(e) => setNotifications({ ...notifications, notifyOnNewMembers: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700"
          />
          <span className="text-sm text-black dark:text-white">
            Notificar sobre novos membros
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifications.notifyOnWorkflowExecutions}
            onChange={(e) => setNotifications({ ...notifications, notifyOnWorkflowExecutions: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700"
          />
          <span className="text-sm text-black dark:text-white">
            Notificar sobre execuções de workflows
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifications.notifyOnAgentErrors}
            onChange={(e) => setNotifications({ ...notifications, notifyOnAgentErrors: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700"
          />
          <span className="text-sm text-black dark:text-white">
            Notificar sobre erros em agentes
          </span>
        </label>
      </div>
      <div className="flex items-center justify-end pt-4 border-t border-gray-200/50 dark:border-white/10">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Notificações
            </>
          )}
        </button>
      </div>
    </div>
  )
}


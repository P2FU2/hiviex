/**
 * Permissions Section Component
 * 
 * Configure workspace permissions
 */

'use client'

import { useState, useEffect } from 'react'
import { Shield, Save, Loader2 } from 'lucide-react'

interface PermissionsSectionProps {
  workspaceId: string
}

export default function PermissionsSection({ workspaceId }: PermissionsSectionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [permissions, setPermissions] = useState({
    membersCanCreateAgents: true,
    membersCanCreateWorkflows: true,
    approvalRequiredForNewMembers: false,
  })

  useEffect(() => {
    loadPermissions()
  }, [workspaceId])

  const loadPermissions = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save permissions')
      }

      showNotification('Permissões salvas com sucesso!', 'success')
    } catch (error) {
      console.error('Error saving permissions:', error)
      showNotification(error instanceof Error ? error.message : 'Erro ao salvar permissões', 'error')
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
        Configure as permissões padrão para novos membros
      </p>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={permissions.membersCanCreateAgents}
            onChange={(e) => setPermissions({ ...permissions, membersCanCreateAgents: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700"
          />
          <span className="text-sm text-black dark:text-white">
            Membros podem criar agentes
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={permissions.membersCanCreateWorkflows}
            onChange={(e) => setPermissions({ ...permissions, membersCanCreateWorkflows: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700"
          />
          <span className="text-sm text-black dark:text-white">
            Membros podem criar workflows
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={permissions.approvalRequiredForNewMembers}
            onChange={(e) => setPermissions({ ...permissions, approvalRequiredForNewMembers: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-700"
          />
          <span className="text-sm text-black dark:text-white">
            Aprovação necessária para novos membros
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
              Salvar Permissões
            </>
          )}
        </button>
      </div>
    </div>
  )
}


/**
 * Workspace Settings Form Component
 * 
 * Form to edit workspace general settings
 */

'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface WorkspaceSettingsFormProps {
  workspaceId: string
  workspace: {
    id: string
    name: string
    slug: string
  }
}

export default function WorkspaceSettingsForm({
  workspaceId,
  workspace,
}: WorkspaceSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: workspace.name || '',
    slug: workspace.slug || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || 'Failed to update workspace')
      }

      const updatedWorkspace = await response.json()
      
      // Update local state with response
      setFormData({
        name: updatedWorkspace.name,
        slug: updatedWorkspace.slug,
      })

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      successMsg.textContent = 'Workspace atualizado com sucesso!'
      document.body.appendChild(successMsg)
      
      setTimeout(() => {
        successMsg.remove()
        // Refresh page to show updated data
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error updating workspace:', error)
      
      // Show error message
      const errorMsg = document.createElement('div')
      errorMsg.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      errorMsg.textContent = error instanceof Error ? error.message : 'Erro ao atualizar workspace'
      document.body.appendChild(errorMsg)
      
      setTimeout(() => {
        errorMsg.remove()
      }, 4000)
    } finally {
      setIsSaving(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome do Workspace *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
          placeholder="Nome do workspace"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Slug (URL) *
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          required
          pattern="[a-z0-9-]+"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
          placeholder="workspace-slug"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Usado na URL. Apenas letras minúsculas, números e hífens.
        </p>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-gray-200/50 dark:border-white/10">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </form>
  )
}


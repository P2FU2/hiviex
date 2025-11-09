/**
 * Workspace API Keys Section Component
 * 
 * Manage workspace shared API keys
 */

'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Eye, EyeOff, Save, Loader2, X } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  provider: string
  key: string
  isVisible: boolean
}

interface WorkspaceApiKeysSectionProps {
  workspaceId: string
  userRole: string
}

export default function WorkspaceApiKeysSection({
  workspaceId,
  userRole,
}: WorkspaceApiKeysSectionProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKey, setNewKey] = useState({ name: '', provider: 'openai', key: '' })

  useEffect(() => {
    if (userRole === 'OWNER' || userRole === 'ADMIN') {
      loadApiKeys()
    }
  }, [workspaceId, userRole])

  const loadApiKeys = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/api-keys`)
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.map((k: any) => ({ ...k, isVisible: false })))
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    }
  }

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add API key')
      }

      const addedKey = await response.json()
      setApiKeys([...apiKeys, { ...addedKey, isVisible: false }])
      setShowAddModal(false)
      setNewKey({ name: '', provider: 'openai', key: '' })
      showNotification('Chave API adicionada com sucesso!', 'success')
    } catch (error) {
      console.error('Error adding API key:', error)
      showNotification(error instanceof Error ? error.message : 'Erro ao adicionar chave API', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Tem certeza que deseja remover esta chave API?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete API key')
      }

      setApiKeys(apiKeys.filter(k => k.id !== keyId))
      showNotification('Chave API removida com sucesso!', 'success')
    } catch (error) {
      console.error('Error deleting API key:', error)
      showNotification(error instanceof Error ? error.message : 'Erro ao remover chave API', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVisibility = (keyId: string) => {
    setApiKeys(apiKeys.map(k => 
      k.id === keyId ? { ...k, isVisible: !k.isVisible } : k
    ))
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

  if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Apenas administradores podem gerenciar chaves API do workspace.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Gerencie as chaves API compartilhadas do workspace
      </p>
      
      <div className="space-y-3">
        {apiKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="p-4 border border-gray-200/50 dark:border-white/10 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-black dark:text-white">{apiKey.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{apiKey.provider}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(apiKey.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                >
                  {apiKey.isVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteKey(apiKey.id)}
                  disabled={isLoading}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-2">
              <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                {apiKey.isVisible ? apiKey.key : '•'.repeat(20)}
              </code>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full px-4 py-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-black dark:text-white">Adicionar Nova Chave</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Configure uma chave API compartilhada</p>
          </div>
          <Key className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Add API Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200/50 dark:border-white/10 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Adicionar Chave API
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>
            <form onSubmit={handleAddKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Ex: OpenAI Production"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provedor *
                </label>
                <select
                  value={newKey.provider}
                  onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="cohere">Cohere</option>
                  <option value="google">Google AI</option>
                  <option value="mistral">Mistral AI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chave API *
                </label>
                <input
                  type="password"
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                  placeholder="sk-..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


/**
 * Settings Page
 * 
 * Configurações do usuário e API keys com múltiplas chaves e customizadas
 */

'use client'

import { useState, useEffect } from 'react'
import { Save, Key, User, Plus, Trash2, HelpCircle, ExternalLink } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  provider: string
  key: string
  isVisible: boolean
  isCustom?: boolean
}

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    description: 'Para usar GPT-4, GPT-3.5 e outros modelos OpenAI',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/',
    description: 'Para usar Claude e outros modelos Anthropic',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    placeholder: '...',
    helpUrl: 'https://dashboard.cohere.com/',
    description: 'Para usar modelos Cohere',
  },
  {
    id: 'google',
    name: 'Google AI',
    placeholder: '...',
    helpUrl: 'https://makersuite.google.com/app/apikey',
    description: 'Para usar modelos Google (Gemini, etc)',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    placeholder: '...',
    helpUrl: 'https://console.mistral.ai/',
    description: 'Para usar modelos Mistral',
  },
]

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    apiKeys: [] as ApiKey[],
  })
  const [showCustomProvider, setShowCustomProvider] = useState(false)
  const [customProviderName, setCustomProviderName] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          name: data.name || '',
          email: data.email || '',
          apiKeys: data.apiKeys || [],
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddApiKey = (providerId: string) => {
    const provider = PROVIDERS.find((p) => p.id === providerId)
    if (!provider) return

    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: `${provider.name} Key`,
      provider: providerId,
      key: '',
      isVisible: false,
      isCustom: false,
    }

    setSettings((prev) => ({
      ...prev,
      apiKeys: [...prev.apiKeys, newKey],
    }))
  }

  const handleAddCustomApiKey = () => {
    if (!customProviderName.trim()) {
      alert('Por favor, insira um nome para o provedor')
      return
    }

    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: `${customProviderName} Key`,
      provider: customProviderName.toLowerCase().replace(/\s+/g, '-'),
      key: '',
      isVisible: false,
      isCustom: true,
    }

    setSettings((prev) => ({
      ...prev,
      apiKeys: [...prev.apiKeys, newKey],
    }))

    setCustomProviderName('')
    setShowCustomProvider(false)
  }

  const handleRemoveApiKey = (keyId: string) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.filter((k) => k.id !== keyId),
    }))
  }

  const handleUpdateApiKey = (keyId: string, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.map((k) =>
        k.id === keyId ? { ...k, [field]: value } : k
      ),
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Configurações
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gerencie suas configurações e API keys
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Keys */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-black dark:text-white">
                API Keys
              </h2>
            </div>
          </div>

          {/* Add Provider Buttons */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Adicionar API Key:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PROVIDERS.map((provider) => {
                const hasKey = settings.apiKeys.some((k) => k.provider === provider.id && !k.isCustom)
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleAddApiKey(provider.id)}
                    disabled={hasKey}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {provider.name}
                  </button>
                )
              })}
            </div>
            {!showCustomProvider ? (
              <button
                onClick={() => setShowCustomProvider(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Provedor Customizado
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customProviderName}
                  onChange={(e) => setCustomProviderName(e.target.value)}
                  placeholder="Nome do provedor (ex: Custom API)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddCustomApiKey()
                  }}
                />
                <button
                  onClick={handleAddCustomApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowCustomProvider(false)
                    setCustomProviderName('')
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* API Keys List */}
          <div className="space-y-4">
            {settings.apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma API key configurada</p>
                <p className="text-sm mt-1">
                  Adicione uma API key acima para começar
                </p>
              </div>
            ) : (
              settings.apiKeys.map((apiKey) => {
                const provider = PROVIDERS.find((p) => p.id === apiKey.provider)
                return (
                  <div
                    key={apiKey.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={apiKey.name}
                            onChange={(e) =>
                              handleUpdateApiKey(apiKey.id, 'name', e.target.value)
                            }
                            className="text-sm font-medium text-black dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                            placeholder="Nome da chave"
                          />
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                            {apiKey.isCustom ? apiKey.provider : provider?.name}
                          </span>
                          {apiKey.isCustom && (
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={apiKey.isVisible ? 'text' : 'password'}
                            value={apiKey.key}
                            onChange={(e) =>
                              handleUpdateApiKey(apiKey.id, 'key', e.target.value)
                            }
                            placeholder={provider?.placeholder || 'Cole sua API key aqui'}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateApiKey(
                                apiKey.id,
                                'isVisible',
                                !apiKey.isVisible
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {apiKey.isVisible ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveApiKey(apiKey.id)}
                        className="ml-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {provider && !apiKey.isCustom && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p>{provider.description}</p>
                          <a
                            href={provider.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Como obter <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Perfil
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Email não pode ser alterado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

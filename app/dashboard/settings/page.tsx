/**
 * Settings Page
 * 
 * Configurações do usuário e API keys com múltiplas chaves e customizadas
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Save,
  Key,
  User,
  Plus,
  Trash2,
  HelpCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  dashBtnPrimary,
  dashBtnSecondary,
  dashInput,
  dashLabel,
  dashLink,
} from '@/lib/dashboard-ui'

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
    description: 'Modelos OpenAI (GPT-4o, o1, etc.) — o runtime usa a API de chat',
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
      apiKeys: prev.apiKeys.map((k: any) =>
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
      <div className="space-y-10">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Card>
          <Card>
            <Skeleton className="h-6 w-24" />
            <div className="mt-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Conta"
        title="Configurações"
        description="Perfil, credenciais de fornecedores e chaves — com isolamento claro e feedback visual consistente."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* API Keys */}
        <Card padding="lg">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                <Key className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h2 className="text-title text-[var(--text-primary)]">API keys</h2>
            </div>
          </div>

          {/* Add Provider Buttons */}
          <div className="mb-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/80 p-4">
            <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Adicionar provedor</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {PROVIDERS.map((provider: any) => {
                const hasKey = settings.apiKeys.some((k) => k.provider === provider.id && !k.isCustom)
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleAddApiKey(provider.id)}
                    disabled={hasKey}
                    className={`${dashBtnSecondary} px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45`}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                    {provider.name}
                  </button>
                )
              })}
            </div>
            {!showCustomProvider ? (
              <button
                type="button"
                onClick={() => setShowCustomProvider(true)}
                className={`${dashBtnPrimary} px-3 py-2 text-xs`}
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Provedor customizado
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={customProviderName}
                  onChange={(e) => setCustomProviderName(e.target.value)}
                  placeholder="Nome do provedor (ex: Custom API)"
                  className={`${dashInput} flex-1 text-sm`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomApiKey()
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomApiKey}
                  className={`${dashBtnPrimary} shrink-0 px-4 py-2 text-sm`}
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomProvider(false)
                    setCustomProviderName('')
                  }}
                  className={`${dashBtnSecondary} shrink-0 px-4 py-2 text-sm`}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* API Keys List */}
          <div className="space-y-4">
            {settings.apiKeys.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border-strong)] py-10 text-center text-[var(--text-secondary)]">
                <Key className="mx-auto mb-3 h-10 w-10 opacity-40" strokeWidth={1.25} />
                <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma API key</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Adicione um provedor acima para começar.
                </p>
              </div>
            ) : (
              settings.apiKeys.map((apiKey: any) => {
                const provider = PROVIDERS.find((p) => p.id === apiKey.provider)
                return (
                  <div
                    key={apiKey.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/50 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={apiKey.name}
                            onChange={(e) =>
                              handleUpdateApiKey(apiKey.id, 'name', e.target.value)
                            }
                            className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-0"
                            placeholder="Nome da chave"
                          />
                          <span className="rounded-md bg-[var(--surface-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
                            {apiKey.isCustom ? apiKey.provider : provider?.name}
                          </span>
                          {apiKey.isCustom ? (
                            <span className="rounded-md bg-[var(--accent-muted)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                              Custom
                            </span>
                          ) : null}
                        </div>
                        <div className="relative">
                          <input
                            type={apiKey.isVisible ? 'text' : 'password'}
                            value={apiKey.key}
                            onChange={(e) =>
                              handleUpdateApiKey(apiKey.id, 'key', e.target.value)
                            }
                            placeholder={provider?.placeholder || 'Cole sua API key aqui'}
                            className={`${dashInput} pr-11 font-mono text-sm`}
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--text-tertiary)] transition-premium hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)]"
                            aria-label={apiKey.isVisible ? 'Ocultar chave' : 'Mostrar chave'}
                          >
                            {apiKey.isVisible ? (
                              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                              <Eye className="h-4 w-4" strokeWidth={1.75} />
                            )}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveApiKey(apiKey.id)}
                        className="shrink-0 rounded-lg p-2 text-[var(--danger)] transition-premium hover:bg-[var(--danger-muted)]"
                        aria-label="Remover chave"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                    {provider && !apiKey.isCustom ? (
                      <div className="mt-2 flex items-start gap-2 text-xs text-[var(--text-tertiary)]">
                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <div className="min-w-0 flex-1">
                          <p>{provider.description}</p>
                          <a
                            href={provider.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${dashLink} mt-1 inline-flex items-center gap-1 text-xs`}
                          >
                            Documentação
                            <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Profile */}
        <Card padding="lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
              <User className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h2 className="text-title text-[var(--text-primary)]">Perfil</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label htmlFor="settings-name" className={dashLabel}>
                Nome
              </label>
              <input
                id="settings-name"
                type="text"
                value={settings.name}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, name: e.target.value }))
                }
                className={dashInput}
              />
            </div>
            <div>
              <label htmlFor="settings-email" className={dashLabel}>
                Email
              </label>
              <input
                id="settings-email"
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, email: e.target.value }))
                }
                className={`${dashInput} opacity-80`}
                disabled
                readOnly
              />
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                O email não pode ser alterado aqui.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end border-t border-[var(--border-subtle)] pt-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`${dashBtnPrimary} min-w-[200px] px-8 py-3 disabled:opacity-45`}
        >
          <Save className="h-5 w-5" strokeWidth={1.75} />
          {isSaving ? 'A guardar…' : 'Guardar alterações'}
        </button>
      </div>
    </div>
  )
}

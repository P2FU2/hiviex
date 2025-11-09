/**
 * Edit Agent Page
 * 
 * Form to edit an existing AI agent
 */

'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [agent, setAgent] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    personality: '',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    status: 'DRAFT' as 'ACTIVE' | 'INACTIVE' | 'DRAFT',
  })

  useEffect(() => {
    // Fetch agent data
    fetch(`/api/agents/${agentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.agent) {
          setAgent(data.agent)
          setFormData({
            name: data.agent.name,
            description: data.agent.description || '',
            personality: data.agent.personality,
            provider: data.agent.provider,
            model: data.agent.model,
            temperature: data.agent.temperature,
            maxTokens: data.agent.maxTokens || 2000,
            status: data.agent.status,
          })
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch agent:', err)
        setError('Failed to load agent')
        setIsLoading(false)
      })
  }, [agentId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update agent')
      }

      // Redirect to agent detail page
      router.push(`/dashboard/agents/${agentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent')
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete agent')
      }

      // Redirect to agents list
      router.push('/dashboard/agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Agent not found</p>
        <Link
          href="/dashboard/agents"
          className="mt-4 inline-block text-black dark:text-white hover:underline"
        >
          Back to agents
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/agents/${agentId}`}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Edit Agent
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update your AI agent&apos;s configuration
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete
            </>
          )}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          {/* Agent Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={100}
              className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          {/* Personality */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Personality / System Prompt *
            </label>
            <textarea
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              required
              minLength={10}
              rows={6}
              className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none font-mono text-sm"
            />
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* LLM Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Provider
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="cohere">Cohere</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Temperature (0-2)
              </label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                }
                min={0}
                max={2}
                step={0.1}
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) =>
                  setFormData({ ...formData, maxTokens: parseInt(e.target.value) })
                }
                min={1}
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/dashboard/agents/${agentId}`}
              className="px-4 py-2 text-black dark:text-white hover:underline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}


/**
 * Agent Detail Page
 * 
 * Página principal do agente com tabs para Persona, Avatar, etc.
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bot,
  Brain,
  User,
  MessageSquare,
  Settings,
  ArrowLeft,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react'

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const [activeTab, setActiveTab] = useState<'overview' | 'persona' | 'avatar' | 'chat'>('overview')
  const [agent, setAgent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAgent()
  }, [agentId])

  const loadAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setAgent(data.agent)
      }
    } catch (error) {
      console.error('Error loading agent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Agente não encontrado</p>
        <Link
          href="/dashboard/agents"
          className="mt-4 inline-block text-black dark:text-white hover:underline"
        >
          Voltar para agentes
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: Bot },
    { id: 'persona', name: 'Persona (MENTE)', icon: Brain },
    { id: 'avatar', name: 'Avatar (CORPO)', icon: User },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/agents"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              {agent.name}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {agent.description || 'Sem descrição'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/agents/${agentId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
          <Link
            href={`/dashboard/agents/${agentId}/chat`}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200/50 dark:border-white/10">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  if (tab.id === 'persona') {
                    router.push(`/dashboard/agents/${agentId}/persona`)
                  } else if (tab.id === 'avatar') {
                    router.push(`/dashboard/agents/${agentId}/avatar`)
                  } else if (tab.id === 'chat') {
                    router.push(`/dashboard/agents/${agentId}/chat`)
                  }
                }}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Status
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    agent.status === 'ACTIVE'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : agent.status === 'DRAFT'
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Modelo
                </h3>
                <p className="text-black dark:text-white">
                  {agent.provider} / {agent.model}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Temperature
                </h3>
                <p className="text-black dark:text-white">{agent.temperature}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Max Tokens
                </h3>
                <p className="text-black dark:text-white">
                  {agent.maxTokens || 'Não definido'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Personalidade / System Prompt
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {agent.personality}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50 dark:border-white/10">
              <Link
                href={`/dashboard/agents/${agentId}/persona`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                Configurar Persona
              </Link>
              <Link
                href={`/dashboard/agents/${agentId}/avatar`}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Configurar Avatar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

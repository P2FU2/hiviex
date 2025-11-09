/**
 * Create New Agent Page
 * 
 * Multi-step form to create a new AI agent
 * Step 1: Basic info and LLM config
 * Step 2: Personality and Appearance
 */

'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, Save, Loader2, Brain, User, ArrowRight, ArrowLeft as ArrowLeftIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Template data
const agentTemplates: Record<string, any> = {
  'research-trends': {
    name: 'Agente de Pesquisa de Tendências',
    description: 'Monitora e analisa tendências de mercado, redes sociais e comportamento do consumidor',
    personality: 'Você é um especialista em análise de tendências e comportamento de mercado. Você monitora constantemente redes sociais, plataformas de conteúdo e dados de mercado para identificar padrões emergentes. Você é objetivo, analítico e sempre baseia suas conclusões em dados concretos. Você apresenta suas descobertas de forma clara e acionável.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  },
  'policy-reader': {
    name: 'Agente Leitor de Políticas',
    description: 'Lê e interpreta políticas de redes sociais e plataformas, gerando relatórios de diretrizes',
    personality: 'Você é um especialista em compliance e políticas de plataformas digitais. Você lê e interpreta documentos legais e termos de serviço com precisão. Você é meticuloso, detalhista e sempre identifica mudanças importantes que podem afetar estratégias de conteúdo. Você comunica informações complexas de forma acessível.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 2000,
  },
  'strategist': {
    name: 'Agente Estrategista',
    description: 'Define estratégias de marketing, aquisição e crescimento baseadas em dados',
    personality: 'Você é um estrategista de marketing digital experiente. Você analisa dados, identifica oportunidades e cria estratégias de crescimento eficazes. Você é visionário, mas também prático. Você sempre considera múltiplos cenários e apresenta planos claros e executáveis.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.8,
    maxTokens: 2500,
  },
  'scriptwriter': {
    name: 'Agente Roteirista',
    description: 'Cria roteiros para vídeos, posts e conteúdo digital com base em estratégias',
    personality: 'Você é um roteirista criativo especializado em conteúdo digital. Você cria narrativas envolventes que conectam com audiências. Você é criativo, mas também estratégico, sempre alinhando suas histórias com objetivos de negócio. Você entende diferentes formatos e plataformas.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.9,
    maxTokens: 3000,
  },
  'copywriter': {
    name: 'Agente Redator',
    description: 'Escreve textos persuasivos, copy de marketing e conteúdo para múltiplos canais',
    personality: 'Você é um copywriter experiente que domina a arte da persuasão através de palavras. Você escreve textos que convertem, sejam para redes sociais, e-mails ou landing pages. Você é direto, persuasivo e sempre focado em resultados. Você adapta seu tom para cada canal e audiência.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.8,
    maxTokens: 2000,
  },
  'video-editor': {
    name: 'Agente Editor de Vídeo',
    description: 'Edita e produz vídeos automaticamente com base em roteiros e estratégias',
    personality: 'Você é um editor de vídeo profissional que entende narrativa visual. Você cria vídeos que capturam atenção e comunicam mensagens de forma eficaz. Você é técnico, mas também criativo. Você sempre prioriza a experiência do espectador.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  },
  'publisher': {
    name: 'Agente Publicador',
    description: 'Publica conteúdo em múltiplas plataformas (Instagram, TikTok, YouTube, etc.)',
    personality: 'Você é um especialista em distribuição de conteúdo multi-plataforma. Você entende as especificidades de cada rede social e otimiza conteúdo para cada uma. Você é organizado, eficiente e sempre garante que o conteúdo certo chegue na hora certa.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.6,
    maxTokens: 2000,
  },
  'optimizer': {
    name: 'Agente Otimizador de Performance',
    description: 'Analisa métricas e otimiza conteúdo para melhor performance',
    personality: 'Você é um analista de dados focado em otimização de performance. Você identifica padrões em métricas e sugere melhorias baseadas em evidências. Você é objetivo, orientado a resultados e sempre busca melhorias incrementais e mensuráveis.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 2000,
  },
  'financial': {
    name: 'Agente Financeiro',
    description: 'Acompanha receitas, despesas, parcerias e métricas financeiras',
    personality: 'Você é um especialista em gestão financeira para negócios digitais. Você acompanha receitas, despesas e ROI de forma precisa. Você é detalhista, organizado e sempre apresenta informações financeiras de forma clara e acionável.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 2000,
  },
  'crm': {
    name: 'Agente CRM / Comunidade',
    description: 'Gerencia relacionamento com clientes, leads e comunidade',
    personality: 'Você é um especialista em relacionamento com clientes e gestão de comunidade. Você é empático, atencioso e sempre busca criar conexões genuínas. Você entende as necessidades das pessoas e trabalha para resolver problemas e criar valor.',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.8,
    maxTokens: 2000,
  },
}

export default function NewAgentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Get workspaces to populate dropdown
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')

  useEffect(() => {
    // Fetch user's workspaces
    fetch('/api/workspaces')
      .then((res) => res.json())
      .then((data) => {
        if (data.tenants) {
          setWorkspaces(data.tenants)
          if (data.tenants.length > 0) {
            setSelectedWorkspaceId(data.tenants[0].tenant.id)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch workspaces:', err)
      })

    // Load template data if template ID is provided
    if (templateId && agentTemplates[templateId]) {
      const template = agentTemplates[templateId]
      setFormData({
        name: template.name,
        description: template.description || '',
        personality: template.personality,
        provider: template.provider || 'openai',
        model: template.model || 'gpt-4',
        temperature: template.temperature ?? 0.7,
        maxTokens: template.maxTokens || 2000,
      })
    }
  }, [templateId])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    personality: '',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  })

  // Step 2: Personality and Appearance
  const [personaData, setPersonaData] = useState({
    objective: '',
    motivation: '',
    voiceTone: '',
    style: '',
    values: '',
    archetype: '',
    emotions: '',
    tags: '',
  })

  const [avatarData, setAvatarData] = useState({
    faceConfig: '',
    hairConfig: '',
    bodyConfig: '',
    style: '',
    clothing: '',
    environment: '',
    lighting: '',
    voiceTimbre: '',
    voiceAccent: '',
    voiceRhythm: '',
  })

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!selectedWorkspaceId) {
      setError('Por favor, selecione um workspace')
      return
    }

    if (!formData.name || !formData.personality) {
      setError('Nome e personalidade são obrigatórios')
      return
    }

    setCurrentStep(2)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!selectedWorkspaceId) {
      setError('Por favor, selecione um workspace')
      setIsLoading(false)
      return
    }

    try {
      // Create agent
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedWorkspaceId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent')
      }

      const agentId = data.agent.id

      // Create persona if data provided
      if (personaData.objective || personaData.motivation) {
        try {
          await fetch(`/api/agents/${agentId}/persona`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              objective: personaData.objective || formData.personality,
              motivation: personaData.motivation || '',
              voiceTone: personaData.voiceTone || '',
              style: personaData.style || '',
              values: personaData.values ? JSON.parse(personaData.values) : null,
              archetype: personaData.archetype || '',
              emotions: personaData.emotions ? JSON.parse(personaData.emotions) : null,
              tags: personaData.tags ? personaData.tags.split(',').map(t => t.trim()) : [],
            }),
          })
        } catch (err) {
          console.error('Error creating persona:', err)
        }
      }

      // Create avatar if data provided
      if (avatarData.style || avatarData.voiceTimbre) {
        try {
          await fetch(`/api/agents/${agentId}/avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              faceConfig: avatarData.faceConfig ? JSON.parse(avatarData.faceConfig) : null,
              hairConfig: avatarData.hairConfig ? JSON.parse(avatarData.hairConfig) : null,
              bodyConfig: avatarData.bodyConfig ? JSON.parse(avatarData.bodyConfig) : null,
              style: avatarData.style || '',
              clothing: avatarData.clothing ? JSON.parse(avatarData.clothing) : null,
              environment: avatarData.environment ? JSON.parse(avatarData.environment) : null,
              lighting: avatarData.lighting ? JSON.parse(avatarData.lighting) : null,
              voiceTimbre: avatarData.voiceTimbre || '',
              voiceAccent: avatarData.voiceAccent || '',
              voiceRhythm: avatarData.voiceRhythm || '',
            }),
          })
        } catch (err) {
          console.error('Error creating avatar:', err)
        }
      }

      // Redirect to agent detail page
      router.push(`/dashboard/agents/${agentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/agents"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Criar Novo Agente
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {currentStep === 1 ? 'Configure informações básicas do agente' : 'Configure personalidade e aparência'}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-black dark:text-white' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-800'}`}>
            1
          </div>
          <span className="font-medium">Informações Básicas</span>
        </div>
        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800">
          <div className={`h-full transition-all ${currentStep >= 2 ? 'bg-black dark:bg-white w-full' : 'w-0'}`} />
        </div>
        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-black dark:text-white' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-800'}`}>
            2
          </div>
          <span className="font-medium">Personalidade & Aparência</span>
        </div>
      </div>

      {/* Form */}
      {currentStep === 1 ? (
        <form onSubmit={handleStep1Next} className="space-y-6">
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
            {/* Workspace Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Workspace *
              </label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="">Selecione um workspace</option>
                {workspaces.map((ws: any) => (
                  <option key={ws.tenant.id} value={ws.tenant.id}>
                    {ws.tenant.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Nome do Agente *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
                placeholder="Meu Assistente IA"
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
                rows={3}
                placeholder="Breve descrição do que este agente faz..."
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
              />
            </div>

            {/* Personality */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Personalidade / System Prompt *
              </label>
              <textarea
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                required
                minLength={10}
                rows={6}
                placeholder="Você é um assistente IA útil. Você é amigável, profissional e sempre tenta fornecer informações precisas..."
                className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mínimo 10 caracteres. Isso define como seu agente se comporta e responde.
              </p>
            </div>

            {/* LLM Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Provedor
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
                  Modelo
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="gpt-4"
                  className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
                  placeholder="2000"
                  className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
                href="/dashboard/agents"
                className="px-4 py-2 text-black dark:text-white hover:underline"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Personalidade (MENTE)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure a personalidade e comportamento do agente. Estes campos são opcionais e podem ser editados depois.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Objetivo e Propósito
                </label>
                <textarea
                  value={personaData.objective}
                  onChange={(e) => setPersonaData({ ...personaData, objective: e.target.value })}
                  rows={3}
                  placeholder="Qual é o objetivo principal deste agente?"
                  className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Motivação
                </label>
                <textarea
                  value={personaData.motivation}
                  onChange={(e) => setPersonaData({ ...personaData, motivation: e.target.value })}
                  rows={2}
                  placeholder="O que motiva este agente?"
                  className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Tom de Voz
                  </label>
                  <input
                    type="text"
                    value={personaData.voiceTone}
                    onChange={(e) => setPersonaData({ ...personaData, voiceTone: e.target.value })}
                    placeholder="Ex: Profissional, Amigável, Técnico"
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Arquétipo
                  </label>
                  <input
                    type="text"
                    value={personaData.archetype}
                    onChange={(e) => setPersonaData({ ...personaData, archetype: e.target.value })}
                    placeholder="Ex: Mentor, Herói, Sábio"
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Estilo Comunicativo
                </label>
                <textarea
                  value={personaData.style}
                  onChange={(e) => setPersonaData({ ...personaData, style: e.target.value })}
                  rows={2}
                  placeholder="Como este agente se comunica?"
                  className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                />
              </div>
            </div>

            <div className="mb-6 pt-6 border-t border-gray-200/50 dark:border-white/10">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-2 flex items-center gap-2">
                <User className="w-5 h-5" />
                Aparência (CORPO) - Opcional
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure a aparência visual e voz do agente (para influenciadores sintéticos).
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Timbre de Voz
                  </label>
                  <input
                    type="text"
                    value={avatarData.voiceTimbre}
                    onChange={(e) => setAvatarData({ ...avatarData, voiceTimbre: e.target.value })}
                    placeholder="Ex: Grave, Agudo, Médio"
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Sotaque
                  </label>
                  <input
                    type="text"
                    value={avatarData.voiceAccent}
                    onChange={(e) => setAvatarData({ ...avatarData, voiceAccent: e.target.value })}
                    placeholder="Ex: Brasileiro, Neutro"
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Ritmo
                  </label>
                  <input
                    type="text"
                    value={avatarData.voiceRhythm}
                    onChange={(e) => setAvatarData({ ...avatarData, voiceRhythm: e.target.value })}
                    placeholder="Ex: Rápido, Moderado, Lento"
                    className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Estilo Visual
                </label>
                <input
                  type="text"
                  value={avatarData.style}
                  onChange={(e) => setAvatarData({ ...avatarData, style: e.target.value })}
                  placeholder="Ex: Moderno, Clássico, Casual"
                  className="w-full px-4 py-2 bg-white dark:bg-black border border-gray-200/50 dark:border-white/10 rounded-lg text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 px-4 py-2 text-black dark:text-white hover:underline"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Voltar
              </button>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    // Skip persona/avatar and create agent with basic data
                    handleSubmit({ preventDefault: () => {} } as FormEvent)
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Pular e Criar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Criar Agente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

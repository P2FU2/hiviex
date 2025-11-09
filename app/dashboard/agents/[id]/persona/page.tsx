/**
 * Persona Designer Page
 * Editor de Personalidade do Agente (MENTE)
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Brain, Target, Heart, Sparkles, Tag } from 'lucide-react'

export default function PersonaDesignerPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [persona, setPersona] = useState({
    objective: '',
    motivation: '',
    voiceTone: '',
    style: '',
    values: [] as string[],
    archetype: '',
    emotions: [] as string[],
    tags: [] as string[],
    behaviorParams: {} as Record<string, any>,
  })

  useEffect(() => {
    loadPersona()
  }, [agentId])

  const loadPersona = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/persona`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setPersona({
            objective: data.objective || '',
            motivation: data.motivation || '',
            voiceTone: data.voiceTone || '',
            style: data.style || '',
            values: Array.isArray(data.values) ? data.values : [],
            archetype: data.archetype || '',
            emotions: Array.isArray(data.emotions) ? data.emotions : [],
            tags: data.tags || [],
            behaviorParams: data.behaviorParams || {},
          })
        }
      }
    } catch (error) {
      console.error('Error loading persona:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/persona`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      })

      if (!response.ok) throw new Error('Failed to save persona')

      alert('Personalidade salva com sucesso!')
    } catch (error) {
      console.error('Error saving persona:', error)
      alert('Erro ao salvar personalidade')
    } finally {
      setIsSaving(false)
    }
  }

  const addArrayItem = (field: 'values' | 'emotions' | 'tags', value: string) => {
    if (!value.trim()) return
    setPersona((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }))
  }

  const removeArrayItem = (field: 'values' | 'emotions' | 'tags', index: number) => {
    setPersona((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
            <Brain className="w-8 h-8" />
            Persona Designer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure a personalidade, objetivos e comportamento do agente (MENTE)
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Objetivo e Propósito */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Objetivo e Propósito
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objetivo Principal *
              </label>
              <textarea
                value={persona.objective}
                onChange={(e) =>
                  setPersona((prev) => ({ ...prev, objective: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                placeholder="Qual é o objetivo principal deste agente?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivação
              </label>
              <textarea
                value={persona.motivation}
                onChange={(e) =>
                  setPersona((prev) => ({ ...prev, motivation: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                placeholder="O que motiva este agente?"
              />
            </div>
          </div>
        </div>

        {/* Tom de Voz e Estilo */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Tom de Voz e Estilo
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tom de Voz
              </label>
              <select
                value={persona.voiceTone}
                onChange={(e) =>
                  setPersona((prev) => ({ ...prev, voiceTone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="friendly">Amigável</option>
                <option value="professional">Profissional</option>
                <option value="humorous">Humorístico</option>
                <option value="empathetic">Empático</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estilo Comunicativo
              </label>
              <textarea
                value={persona.style}
                onChange={(e) =>
                  setPersona((prev) => ({ ...prev, style: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                placeholder="Descreva o estilo de comunicação..."
              />
            </div>
          </div>
        </div>

        {/* Valores e Arquétipo */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Valores e Arquétipo
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arquétipo
              </label>
              <select
                value={persona.archetype}
                onChange={(e) =>
                  setPersona((prev) => ({ ...prev, archetype: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="hero">Herói</option>
                <option value="mentor">Mentor</option>
                <option value="explorer">Explorador</option>
                <option value="sage">Sábio</option>
                <option value="creator">Criador</option>
                <option value="caregiver">Cuidador</option>
                <option value="magician">Mágico</option>
                <option value="rebel">Rebelde</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valores
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addArrayItem('values', e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Adicionar valor (Enter)"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {persona.values.map((value, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {value}
                    <button
                      onClick={() => removeArrayItem('values', idx)}
                      className="hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Emoções e Tags */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Emoções e Tags
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emoções Predominantes
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addArrayItem('emotions', e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Adicionar emoção (Enter)"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {persona.emotions.map((emotion, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {emotion}
                    <button
                      onClick={() => removeArrayItem('emotions', idx)}
                      className="hover:text-purple-800 dark:hover:text-purple-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags Comportamentais
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addArrayItem('tags', e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                  placeholder="Adicionar tag (Enter)"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {persona.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => removeArrayItem('tags', idx)}
                      className="hover:text-gray-800 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


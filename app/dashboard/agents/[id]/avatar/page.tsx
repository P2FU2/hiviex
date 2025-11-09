/**
 * Avatar Studio Page
 * Editor Visual do Agente (CORPO)
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Save, User, Palette, Video, Mic } from 'lucide-react'

export default function AvatarStudioPage() {
  const params = useParams()
  const agentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [avatar, setAvatar] = useState({
    faceConfig: {} as Record<string, any>,
    hairConfig: {} as Record<string, any>,
    bodyConfig: {} as Record<string, any>,
    style: '',
    clothing: {} as Record<string, any>,
    environment: {} as Record<string, any>,
    lighting: {} as Record<string, any>,
    recordingStyle: {} as Record<string, any>,
    voiceTimbre: '',
    voiceAccent: '',
    voiceRhythm: '',
  })

  useEffect(() => {
    loadAvatar()
  }, [agentId])

  const loadAvatar = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/avatar`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setAvatar({
            faceConfig: data.faceConfig || {},
            hairConfig: data.hairConfig || {},
            bodyConfig: data.bodyConfig || {},
            style: data.style || '',
            clothing: data.clothing || {},
            environment: data.environment || {},
            lighting: data.lighting || {},
            recordingStyle: data.recordingStyle || {},
            voiceTimbre: data.voiceTimbre || '',
            voiceAccent: data.voiceAccent || '',
            voiceRhythm: data.voiceRhythm || '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading avatar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(avatar),
      })

      if (!response.ok) throw new Error('Failed to save avatar')

      alert('Avatar salvo com sucesso!')
    } catch (error) {
      console.error('Error saving avatar:', error)
      alert('Erro ao salvar avatar')
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
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
            <User className="w-8 h-8" />
            Avatar Studio
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure a estética visual e voz do agente (CORPO)
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
        {/* Estética Visual */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Estética Visual
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estilo Geral
              </label>
              <select
                value={avatar.style}
                onChange={(e) =>
                  setAvatar((prev) => ({ ...prev, style: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="realistic">Realista</option>
                <option value="cartoon">Cartoon</option>
                <option value="anime">Anime</option>
                <option value="3d">3D</option>
                <option value="minimalist">Minimalista</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Configuração do Rosto (JSON)
              </label>
              <textarea
                value={JSON.stringify(avatar.faceConfig, null, 2)}
                onChange={(e) => {
                  try {
                    setAvatar((prev) => ({
                      ...prev,
                      faceConfig: JSON.parse(e.target.value),
                    }))
                  } catch {}
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                placeholder='{"skinTone": "medium", "eyeColor": "brown", ...}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Configuração do Cabelo (JSON)
              </label>
              <textarea
                value={JSON.stringify(avatar.hairConfig, null, 2)}
                onChange={(e) => {
                  try {
                    setAvatar((prev) => ({
                      ...prev,
                      hairConfig: JSON.parse(e.target.value),
                    }))
                  } catch {}
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                placeholder='{"color": "brown", "style": "short", ...}'
              />
            </div>
          </div>
        </div>

        {/* Visual e Ambiente */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Visual e Ambiente
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Roupa e Acessórios (JSON)
              </label>
              <textarea
                value={JSON.stringify(avatar.clothing, null, 2)}
                onChange={(e) => {
                  try {
                    setAvatar((prev) => ({
                      ...prev,
                      clothing: JSON.parse(e.target.value),
                    }))
                  } catch {}
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                placeholder='{"outfit": "casual", "accessories": []}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ambientação (JSON)
              </label>
              <textarea
                value={JSON.stringify(avatar.environment, null, 2)}
                onChange={(e) => {
                  try {
                    setAvatar((prev) => ({
                      ...prev,
                      environment: JSON.parse(e.target.value),
                    }))
                  } catch {}
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                placeholder='{"background": "studio", "props": []}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Iluminação (JSON)
              </label>
              <textarea
                value={JSON.stringify(avatar.lighting, null, 2)}
                onChange={(e) => {
                  try {
                    setAvatar((prev) => ({
                      ...prev,
                      lighting: JSON.parse(e.target.value),
                    }))
                  } catch {}
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                placeholder='{"type": "soft", "direction": "front"}'
              />
            </div>
          </div>
        </div>

        {/* Voz */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Voz
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timbre
              </label>
              <select
                value={avatar.voiceTimbre}
                onChange={(e) =>
                  setAvatar((prev) => ({ ...prev, voiceTimbre: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="deep">Profundo</option>
                <option value="medium">Médio</option>
                <option value="high">Agudo</option>
                <option value="warm">Quente</option>
                <option value="clear">Claro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sotaque
              </label>
              <select
                value={avatar.voiceAccent}
                onChange={(e) =>
                  setAvatar((prev) => ({ ...prev, voiceAccent: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="neutral">Neutro</option>
                <option value="brazilian">Brasileiro</option>
                <option value="american">Americano</option>
                <option value="british">Britânico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ritmo
              </label>
              <select
                value={avatar.voiceRhythm}
                onChange={(e) =>
                  setAvatar((prev) => ({ ...prev, voiceRhythm: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="slow">Lento</option>
                <option value="normal">Normal</option>
                <option value="fast">Rápido</option>
                <option value="varied">Variado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estilo de Gravação */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Estilo de Gravação
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Configuração de Gravação (JSON)
              </label>
              <textarea
                value={JSON.stringify(avatar.recordingStyle, null, 2)}
                onChange={(e) => {
                  try {
                    setAvatar((prev) => ({
                      ...prev,
                      recordingStyle: JSON.parse(e.target.value),
                    }))
                  } catch {}
                }}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                placeholder='{"angle": "front", "movement": "subtle", "cuts": "smooth"}'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


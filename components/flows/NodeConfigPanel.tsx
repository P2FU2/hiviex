/**
 * Node Configuration Panel
 * 
 * Painel para configurar nós do Flow Builder
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Save, Settings, Layout, Instagram, Twitter, Youtube, Facebook, Linkedin } from 'lucide-react'

interface NodeConfigPanelProps {
  node: any
  agents?: any[]
  onSave: (config: any) => void
  onClose: () => void
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
]

export default function NodeConfigPanel({
  node,
  agents = [],
  onSave,
  onClose,
}: NodeConfigPanelProps) {
  const [config, setConfig] = useState<any>({
    label: node?.data?.label || '',
    description: node?.data?.description || '',
    agentId: node?.data?.agentId || null,
    processType: node?.data?.processType || 'TASK',
    panelType: node?.data?.panelType || 'panel',
    platform: node?.data?.platform || '',
    accountName: node?.data?.accountName || '',
    connectionType: node?.data?.connectionType || 'default',
    content: node?.data?.content || '',
    inputs: node?.data?.inputs || [],
    outputs: node?.data?.outputs || [],
    parameters: node?.data?.parameters || {},
    visualizationType: node?.data?.visualizationType || 'preview',
    ...(node?.data?.config || {}),
  })

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  if (!node) return null

  const isAgentNode = node.type === 'agent'
  const isPanelNode = node.type === 'panel'
  const isSocialNode = node.type === 'social'
  const isContextNode = node.type === 'context'
  const isProcessNode = node.type === 'process'
  const isVisualizationNode = node.type === 'visualization'

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-black rounded-lg border border-gray-200/50 dark:border-white/10 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-black dark:text-white" />
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Configurar Nó
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Nó *
            </label>
            <input
              type="text"
              value={config.label}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              placeholder="Nome do nó"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              placeholder="Descrição do nó (opcional)"
              rows={2}
            />
          </div>

          {/* Agent Selection (for agent nodes) */}
          {isAgentNode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agente
              </label>
              <select
                value={config.agentId || ''}
                onChange={(e) =>
                  setConfig((prev: any) => ({ ...prev, agentId: e.target.value || null }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="">Selecione um agente...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Process Type (for process nodes) */}
          {isProcessNode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Processo
              </label>
              <select
                value={config.processType || 'TASK'}
                onChange={(e) =>
                  setConfig((prev: any) => ({ ...prev, processType: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="TASK">Tarefa</option>
                <option value="AUTOMATION">Automação</option>
                <option value="INTEGRATION">Integração</option>
                <option value="TRIGGER">Trigger</option>
                <option value="RULE">Regra</option>
              </select>
            </div>
          )}

          {/* Context Node - Content */}
          {isContextNode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo
              </label>
              <textarea
                value={config.content || ''}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
                placeholder="Texto ou conteúdo do contexto..."
                rows={6}
              />
            </div>
          )}

          {/* Process Node - Inputs/Outputs */}
          {isProcessNode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Inputs
                </label>
                <div className="space-y-2">
                  {(config.inputs || []).map((input: any, idx: number) => (
                    <div key={input.id || idx} className="flex gap-2">
                      <input
                        type="text"
                        value={input.name || ''}
                        onChange={(e) => {
                          const newInputs = [...(config.inputs || [])]
                          newInputs[idx] = { ...newInputs[idx], name: e.target.value }
                          setConfig((prev: any) => ({ ...prev, inputs: newInputs }))
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                        placeholder="Nome do input"
                      />
                      <select
                        value={input.type || 'text'}
                        onChange={(e) => {
                          const newInputs = [...(config.inputs || [])]
                          newInputs[idx] = { ...newInputs[idx], type: e.target.value }
                          setConfig((prev: any) => ({ ...prev, inputs: newInputs }))
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                      >
                        <option value="text">Texto</option>
                        <option value="json">JSON</option>
                        <option value="image">Imagem</option>
                        <option value="latent">Latent</option>
                        <option value="number">Número</option>
                      </select>
                      <button
                        onClick={() => {
                          const newInputs = (config.inputs || []).filter((_: any, i: number) => i !== idx)
                          setConfig((prev: any) => ({ ...prev, inputs: newInputs }))
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newInputs = [...(config.inputs || []), { id: `input-${Date.now()}`, name: '', type: 'text' }]
                      setConfig((prev: any) => ({ ...prev, inputs: newInputs }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    + Adicionar Input
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Outputs
                </label>
                <div className="space-y-2">
                  {(config.outputs || []).map((output: any, idx: number) => (
                    <div key={output.id || idx} className="flex gap-2">
                      <input
                        type="text"
                        value={output.name || ''}
                        onChange={(e) => {
                          const newOutputs = [...(config.outputs || [])]
                          newOutputs[idx] = { ...newOutputs[idx], name: e.target.value }
                          setConfig((prev: any) => ({ ...prev, outputs: newOutputs }))
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                        placeholder="Nome do output"
                      />
                      <select
                        value={output.type || 'text'}
                        onChange={(e) => {
                          const newOutputs = [...(config.outputs || [])]
                          newOutputs[idx] = { ...newOutputs[idx], type: e.target.value }
                          setConfig((prev: any) => ({ ...prev, outputs: newOutputs }))
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                      >
                        <option value="text">Texto</option>
                        <option value="json">JSON</option>
                        <option value="image">Imagem</option>
                        <option value="latent">Latent</option>
                        <option value="number">Número</option>
                      </select>
                      <button
                        onClick={() => {
                          const newOutputs = (config.outputs || []).filter((_: any, i: number) => i !== idx)
                          setConfig((prev: any) => ({ ...prev, outputs: newOutputs }))
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOutputs = [...(config.outputs || []), { id: `output-${Date.now()}`, name: '', type: 'text' }]
                      setConfig((prev: any) => ({ ...prev, outputs: newOutputs }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    + Adicionar Output
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Visualization Node - Type */}
          {isVisualizationNode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Visualização
              </label>
              <select
                value={config.visualizationType || 'preview'}
                onChange={(e) =>
                  setConfig((prev: any) => ({ ...prev, visualizationType: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="preview">Prévia</option>
                <option value="logs">Logs</option>
                <option value="result">Resultado</option>
              </select>
            </div>
          )}

          {/* Panel Type (for panel nodes) */}
          {isPanelNode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Painel
              </label>
              <select
                value={config.panelType || 'panel'}
                onChange={(e) =>
                  setConfig((prev: any) => ({ ...prev, panelType: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="panel">Painel Geral</option>
                <option value="social">Painel Social</option>
                <option value="integration">Painel de Integração</option>
              </select>
            </div>
          )}

          {/* Social Account Config (for social nodes) */}
          {isSocialNode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plataforma
                </label>
                <select
                  value={config.platform || ''}
                  onChange={(e) =>
                    setConfig((prev: any) => ({ ...prev, platform: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="">Selecione uma plataforma...</option>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  value={config.accountName || ''}
                  onChange={(e) =>
                    setConfig((prev: any) => ({ ...prev, accountName: e.target.value }))
                  }
                  placeholder="@username ou nome da conta"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                />
              </div>
            </>
          )}

          {/* Connection Type (for all nodes with connections) */}
          {(isPanelNode || isSocialNode) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Conexão (Mind Map)
              </label>
              <select
                value={config.connectionType || 'default'}
                onChange={(e) =>
                  setConfig((prev: any) => ({ ...prev, connectionType: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              >
                <option value="default">Padrão</option>
                <option value="depends">Depende de</option>
                <option value="triggers">Dispara</option>
                <option value="feeds">Alimenta</option>
                <option value="validates">Valida</option>
                <option value="transforms">Transforma</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Define o significado da conexão no mind map
              </p>
            </div>
          )}

          {/* Advanced Config */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Configuração Avançada (JSON)
            </label>
            <textarea
              value={JSON.stringify(config.config || {}, null, 2)}
              onChange={(e) => {
                try {
                  setConfig((prev: any) => ({
                    ...prev,
                    config: JSON.parse(e.target.value),
                  }))
                } catch {}
              }}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50 dark:border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


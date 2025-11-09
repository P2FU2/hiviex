/**
 * Guides & Manuals Page
 * 
 * Guias e manuais explicando como usar cada ferramenta
 */

'use client'

import { Book, Bot, GitBranch, BarChart3, Settings, Key, Play, Save } from 'lucide-react'
import Link from 'next/link'

const guides = [
  {
    id: 'flow-builder',
    title: 'Flow Builder',
    icon: GitBranch,
    color: 'blue',
    sections: [
      {
        title: 'Criar um Flow',
        steps: [
          'Vá em Flow Builder → Criar',
          'Clique em "Adicionar Agente" ou "Adicionar Processo"',
          'Clique no nó para configurá-lo',
          'Arraste entre nós para criar conexões',
          'Clique em "Salvar" para salvar o flow',
        ],
      },
      {
        title: 'Configurar Nós',
        steps: [
          'Clique em um nó no canvas',
          'Para nós de Agente: selecione um agente da lista',
          'Para nós de Processo: escolha o tipo (Tarefa, Automação, etc)',
          'Configure opções avançadas no JSON se necessário',
        ],
      },
      {
        title: 'Executar Flow',
        steps: [
          'Certifique-se de que todos os nós estão configurados',
          'Clique em "Executar"',
          'Acompanhe a execução em tempo real',
          'Veja os logs e resultados na página de execuções',
        ],
      },
    ],
  },
  {
    id: 'agents',
    title: 'Agentes',
    icon: Bot,
    color: 'purple',
    sections: [
      {
        title: 'Criar um Agente',
        steps: [
          'Vá em Agents → Biblioteca',
          'Escolha um template ou crie um novo',
          'Configure o nome e descrição',
          'Defina a personalidade (system prompt)',
          'Escolha o provedor de LLM (OpenAI, Anthropic, etc)',
        ],
      },
      {
        title: 'Configurar Persona',
        steps: [
          'Vá em Agents → [Seu Agente] → Persona',
          'Defina objetivo e propósito',
          'Configure tom de voz e estilo',
          'Adicione valores e arquétipo',
          'Salve as configurações',
        ],
      },
      {
        title: 'Chat com Agente',
        steps: [
          'Vá em Agents → [Seu Agente] → Chat',
          'Digite sua mensagem',
          'O agente responderá usando o LLM configurado',
          'Histórico é salvo automaticamente',
        ],
      },
    ],
  },
  {
    id: 'api-keys',
    title: 'Configurar API Keys',
    icon: Key,
    color: 'green',
    sections: [
      {
        title: 'Adicionar API Key',
        steps: [
          'Vá em Settings → API Keys',
          'Clique no botão do provedor desejado (OpenAI, Anthropic, etc)',
          'Cole sua API key no campo',
          'Dê um nome descritivo para a chave',
          'Clique em "Salvar Configurações"',
        ],
      },
      {
        title: 'Obter API Key - OpenAI',
        steps: [
          'Acesse https://platform.openai.com/api-keys',
          'Faça login na sua conta OpenAI',
          'Clique em "Create new secret key"',
          'Copie a chave (ela só aparece uma vez!)',
          'Cole no Settings do HIVIEX',
        ],
      },
      {
        title: 'Obter API Key - Anthropic',
        steps: [
          'Acesse https://console.anthropic.com/',
          'Faça login na sua conta Anthropic',
          'Vá em API Keys',
          'Clique em "Create Key"',
          'Copie e cole no HIVIEX',
        ],
      },
      {
        title: 'Obter API Key - Cohere',
        steps: [
          'Acesse https://dashboard.cohere.com/',
          'Faça login na sua conta',
          'Vá em API Keys',
          'Crie uma nova chave',
          'Copie e cole no HIVIEX',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    color: 'orange',
    sections: [
      {
        title: 'Ver Métricas',
        steps: [
          'Vá em Analytics → Dashboard',
          'Veja métricas em tempo real',
          'Filtre por período',
          'Compare com períodos anteriores',
        ],
      },
      {
        title: 'Relatórios',
        steps: [
          'Vá em Analytics → Relatórios',
          'Selecione o período desejado',
          'Veja métricas detalhadas por canal',
          'Exporte os dados se necessário',
        ],
      },
    ],
  },
]

export default function GuidesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Book className="w-8 h-8 text-black dark:text-white" />
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Guias e Manuais
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Aprenda a usar todas as ferramentas do HIVIEX
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/settings"
          className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
          <h3 className="font-semibold text-black dark:text-white">Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configurar API keys
          </p>
        </Link>
        <Link
          href="/dashboard/flows"
          className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow"
        >
          <GitBranch className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
          <h3 className="font-semibold text-black dark:text-white">Flow Builder</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Criar flows visuais
          </p>
        </Link>
        <Link
          href="/dashboard/agents"
          className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Bot className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
          <h3 className="font-semibold text-black dark:text-white">Agents</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerenciar agentes
          </p>
        </Link>
        <Link
          href="/dashboard/analytics"
          className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow"
        >
          <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
          <h3 className="font-semibold text-black dark:text-white">Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Ver métricas
          </p>
        </Link>
      </div>

      {/* Guides */}
      <div className="space-y-6">
        {guides.map((guide) => {
          const Icon = guide.icon
          const colorClasses = {
            blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
            purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
            green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
            orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
          }

          return (
            <div
              key={guide.id}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`p-3 rounded-lg ${colorClasses[guide.color as keyof typeof colorClasses]}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-black dark:text-white">
                  {guide.title}
                </h2>
              </div>

              <div className="space-y-6">
                {guide.sections.map((section, idx) => (
                  <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <h3 className="font-semibold text-lg text-black dark:text-white mb-3">
                      {section.title}
                    </h3>
                    <ol className="space-y-2">
                      {section.steps.map((step, stepIdx) => (
                        <li
                          key={stepIdx}
                          className="flex gap-3 text-gray-700 dark:text-gray-300"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-medium flex items-center justify-center">
                            {stepIdx + 1}
                          </span>
                          <span className="flex-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


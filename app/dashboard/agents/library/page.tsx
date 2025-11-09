/**
 * Agents Library Page
 * 
 * Biblioteca de agentes pré-prontos que podem ser duplicados e personalizados
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import Link from 'next/link'
import { Bot, Copy, Search, FileText, Video, TrendingUp, DollarSign, Users, Settings, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Template agents pré-prontos
const agentTemplates = [
  {
    id: 'research-trends',
    name: 'Agente de Pesquisa de Tendências',
    description: 'Monitora e analisa tendências de mercado, redes sociais e comportamento do consumidor',
    icon: Search,
    color: 'blue',
    category: 'Pesquisa',
    features: ['Análise de tendências', 'Monitoramento de redes sociais', 'Relatórios automáticos'],
  },
  {
    id: 'policy-reader',
    name: 'Agente Leitor de Políticas',
    description: 'Lê e interpreta políticas de redes sociais e plataformas, gerando relatórios de diretrizes',
    icon: FileText,
    color: 'purple',
    category: 'Compliance',
    features: ['Leitura de políticas', 'Análise de diretrizes', 'Alertas de mudanças'],
  },
  {
    id: 'strategist',
    name: 'Agente Estrategista',
    description: 'Define estratégias de marketing, aquisição e crescimento baseadas em dados',
    icon: TrendingUp,
    color: 'green',
    category: 'Estratégia',
    features: ['Planejamento estratégico', 'Análise de funil', 'Definição de narrativas'],
  },
  {
    id: 'scriptwriter',
    name: 'Agente Roteirista',
    description: 'Cria roteiros para vídeos, posts e conteúdo digital com base em estratégias',
    icon: FileText,
    color: 'orange',
    category: 'Criação',
    features: ['Roteiros de vídeo', 'Scripts de posts', 'Narrativas criativas'],
  },
  {
    id: 'copywriter',
    name: 'Agente Redator',
    description: 'Escreve textos persuasivos, copy de marketing e conteúdo para múltiplos canais',
    icon: FileText,
    color: 'pink',
    category: 'Criação',
    features: ['Copy de marketing', 'Posts para redes sociais', 'E-mails e newsletters'],
  },
  {
    id: 'video-editor',
    name: 'Agente Editor de Vídeo',
    description: 'Edita e produz vídeos automaticamente com base em roteiros e estratégias',
    icon: Video,
    color: 'red',
    category: 'Produção',
    features: ['Edição automática', 'Montagem de vídeos', 'Adição de efeitos'],
  },
  {
    id: 'publisher',
    name: 'Agente Publicador',
    description: 'Publica conteúdo em múltiplas plataformas (Instagram, TikTok, YouTube, etc.)',
    icon: Sparkles,
    color: 'indigo',
    category: 'Distribuição',
    features: ['Publicação multi-canal', 'Agendamento', 'Otimização por plataforma'],
  },
  {
    id: 'optimizer',
    name: 'Agente Otimizador de Performance',
    description: 'Analisa métricas e otimiza conteúdo para melhor performance',
    icon: TrendingUp,
    color: 'teal',
    category: 'Otimização',
    features: ['Análise de métricas', 'A/B testing', 'Otimização contínua'],
  },
  {
    id: 'financial',
    name: 'Agente Financeiro',
    description: 'Acompanha receitas, despesas, parcerias e métricas financeiras',
    icon: DollarSign,
    color: 'yellow',
    category: 'Financeiro',
    features: ['Gestão de receitas', 'Análise de ROI', 'Relatórios financeiros'],
  },
  {
    id: 'crm',
    name: 'Agente CRM / Comunidade',
    description: 'Gerencia relacionamento com clientes, leads e comunidade',
    icon: Users,
    color: 'cyan',
    category: 'Relacionamento',
    features: ['Gestão de leads', 'Comunidade', 'Atendimento automatizado'],
  },
]

export default async function AgentsLibraryPage() {
  const session = await getAuthSession()

  // Get user's workspaces for creating agents
  const tenantMemberships = await getUserTenants(session.user.id)

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
      red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
      teal: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      cyan: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Biblioteca de Agentes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Escolha um agente pré-configurado ou crie um personalizado
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
        >
          <Bot className="w-5 h-5" />
          Criar Agente Personalizado
        </Link>
      </div>

      {/* Agent Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentTemplates.map((template) => {
          const Icon = template.icon
          return (
            <div
              key={template.id}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(template.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {template.category}
                </span>
              </div>

              <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>

              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 uppercase">
                  Funcionalidades
                </h4>
                <ul className="space-y-1">
                  {template.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200/50 dark:border-white/10">
                <Link
                  href={`/dashboard/agents/new?template=${template.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white"
                >
                  <Copy className="w-4 h-4" />
                  Usar Template
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


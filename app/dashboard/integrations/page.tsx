'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plug,
  Youtube,
  Instagram,
  Facebook,
  Music2,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Building2,
  Sparkles,
} from 'lucide-react'

type Tenant = { id: string; name: string; slug: string }

const PLATFORMS: {
  id: string
  name: string
  description: string
  icon: typeof Youtube
  color: string
  available: boolean
}[] = [
  {
    id: 'YOUTUBE',
    name: 'YouTube',
    description: 'Publicar e gerir conteúdo no canal (OAuth Google).',
    icon: Youtube,
    color: 'from-red-600 to-rose-600',
    available: true,
  },
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    description: 'Conta Business ligada a uma Página Facebook (Meta).',
    icon: Instagram,
    color: 'from-pink-600 to-purple-600',
    available: true,
  },
  {
    id: 'FACEBOOK',
    name: 'Facebook',
    description:
      'Páginas (Graph API): vídeo por URL pública, fotos ou post de texto. Mesmo app Meta que o Instagram.',
    icon: Facebook,
    color: 'from-blue-600 to-indigo-600',
    available: true,
  },
  {
    id: 'TIKTOK',
    name: 'TikTok',
    description: 'Integração Content Posting — roadmap (worker falha de forma controlada).',
    icon: Music2,
    color: 'from-zinc-800 to-zinc-600',
    available: false,
  },
  {
    id: 'KWAII',
    name: 'Kwai',
    description: 'Roadmap — mesmo app trata a plataforma sem erros na factory.',
    icon: Sparkles,
    color: 'from-orange-600 to-amber-600',
    available: false,
  },
  {
    id: 'GMAIL',
    name: 'Gmail',
    description: 'E-mail / anexos — roadmap.',
    icon: Mail,
    color: 'from-slate-600 to-slate-500',
    available: false,
  },
]

function IntegrationsInner() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  const notice = searchParams.get('notice')
  const plannedPlatform = searchParams.get('platform')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [workspaceId, setWorkspaceId] = useState<string>('')

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.tenants || []).map(
          (m: { tenant: Tenant }) => m.tenant
        ) as Tenant[]
        setTenants(list)
        if (list[0]?.id) setWorkspaceId(list[0].id)
      })
      .catch(() => {})
  }, [])

  const connectUrl = (platform: string) =>
    `/api/integrations/oauth/${platform}/init?tenantId=${encodeURIComponent(workspaceId)}`

  const banner = useMemo(() => {
    if (success) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>
            Conta ligada com sucesso: <strong>{success}</strong>
          </span>
        </div>
      )
    }
    if (error) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="break-all">{decodeURIComponent(error)}</span>
        </div>
      )
    }
    if (notice === 'planned' && plannedPlatform) {
      const label: Record<string, string> = {
        FACEBOOK: 'Facebook',
        TIKTOK: 'TikTok',
        KWAII: 'Kwai',
        GMAIL: 'Gmail',
      }
      const name = label[plannedPlatform] ?? plannedPlatform
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            A integração <strong>{name}</strong> ainda não está disponível para OAuth nesta versão.
            Utiliza <strong>YouTube</strong> ou <strong>Instagram</strong> para publicar; as restantes
            plataformas estão planeadas sem bloquear workers.
          </span>
        </div>
      )
    }
    return null
  }, [success, error, notice, plannedPlatform])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent mb-2">
            <Plug className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Conexões
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Integrações sociais
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
            Liga as contas do workspace para agendar e publicar conteúdo. As
            credenciais são armazenadas de forma cifrada.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/media"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            Biblioteca de mídia (S3/R2)
          </Link>
          <Link
            href="/dashboard/workspaces"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            <Building2 className="w-4 h-4" />
            Gerir workspaces
          </Link>
        </div>
      </div>

      {banner}

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 backdrop-blur-xl p-4 sm:p-5 shadow-glass dark:shadow-glass-dark">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Workspace ativo
        </label>
        <select
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
          className="w-full max-w-md rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-white"
        >
          {tenants.length === 0 ? (
            <option value="">Carregar workspaces…</option>
          ) : (
            tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))
          )}
        </select>
        {tenants.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Cria um workspace primeiro para ligar contas.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`absolute inset-0 opacity-[0.07] bg-gradient-to-br ${p.color}`}
            />
            <div className="relative flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-white shadow-lg`}
              >
                <p.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  {p.name}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {p.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.available && workspaceId ? (
                    <a
                      href={connectUrl(p.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-black hover:opacity-90 transition-opacity"
                    >
                      Ligar conta
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : p.available ? (
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Seleciona um workspace acima.
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                      Em breve
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
        Para publicação agendada e processamento em fila funcionarem em produção, o
        operador deve configurar{' '}
        <Link
          href="/dashboard/status"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          Redis e o worker
        </Link>
        . Modelos de IA usados pelos agentes configuram-se em{' '}
        <Link
          href="/dashboard/apis"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          APIs e IA
        </Link>
        .
      </p>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-lg bg-gray-200 dark:bg-white/10" />
          <div className="h-32 rounded-2xl bg-gray-200 dark:bg-white/10" />
        </div>
      }
    >
      <IntegrationsInner />
    </Suspense>
  )
}

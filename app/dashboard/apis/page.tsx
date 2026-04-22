/**
 * Hub APIs & IA — conexões de modelos, chaves por workspace e fluxo até ao chat/flows.
 */

import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Card } from '@/components/ui/Card'
import {
  Key,
  Bot,
  GitBranch,
  MessageSquare,
  ExternalLink,
  Shield,
  Server,
} from 'lucide-react'
import { dashBtnSecondary, dashLink } from '@/lib/dashboard-ui'
import type { TenantRole } from '@/lib/types/domain'

export const dynamic = 'force-dynamic'

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    slug: 'openai',
    models: 'Recomendado: gpt-4o · também gpt-4o-mini, o1, etc.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    slug: 'anthropic',
    models: 'Recomendado: claude-sonnet-4-6 · também Opus/Haiku conforme a conta.',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    slug: 'cohere',
    models: 'Chat API v2 — ex.: command-a-03-2025, command-r-plus…',
  },
] as const

function canManageKeys(role: TenantRole): boolean {
  return role === 'OWNER' || role === 'ADMIN'
}

export default async function ApisHubPage() {
  const session = await getAuthSession()
  const memberships = await getUserTenants(session.user.id)

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Integração técnica"
        title="APIs e IA"
        description="Ligue os modelos ao Hiviex: chaves por workspace alimentam o chat com agentes, flows e workers. O provedor da chave deve coincidir com o campo «provider» do agente."
      >
        <Link href="/dashboard/settings" className={dashBtnSecondary}>
          Definições da conta
        </Link>
        <Link href="/dashboard/chat" className={dashBtnSecondary}>
          <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
          Chat
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <h2 className="text-title mb-4 flex items-center gap-2 text-[var(--text-primary)]">
            <Server className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
            Provedores suportados no runtime
          </h2>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            Ao criar uma chave no workspace, use o identificador exato{' '}
            <code className="rounded bg-[var(--surface-base)] px-1.5 py-0.5 font-mono text-xs">
              openai
            </code>
            ,{' '}
            <code className="rounded bg-[var(--surface-base)] px-1.5 py-0.5 font-mono text-xs">
              anthropic
            </code>{' '}
            ou{' '}
            <code className="rounded bg-[var(--surface-base)] px-1.5 py-0.5 font-mono text-xs">
              cohere
            </code>{' '}
            — igual ao configurado no agente.
          </p>
          <ul className="space-y-3">
            {PROVIDERS.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{p.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{p.models}</p>
                </div>
                <code className="text-xs font-mono text-[var(--accent)]">{p.slug}</code>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--text-tertiary)]">
            Em produção, o servidor pode ainda usar{' '}
            <code className="font-mono">OPENAI_API_KEY</code> como fallback global; para
            multi-tenant, prefira sempre chaves no workspace.
          </p>
        </Card>

        <Card padding="lg">
          <h2 className="text-title mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <Bot className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
            Onde isto é usado
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
              <span>
                <strong className="text-[var(--text-primary)]">Chat</strong> —{' '}
                <Link href="/dashboard/chat" className={dashLink}>
                  /dashboard/chat
                </Link>
              </span>
            </li>
            <li className="flex gap-2">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
              <span>
                <strong className="text-[var(--text-primary)]">Flows</strong> — nós que
                chamam o LLM do agente.
              </span>
            </li>
            <li className="flex gap-2">
              <Server className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
              <span>
                <strong className="text-[var(--text-primary)]">Workers</strong> — jobs em
                fila (vídeo, influenciadores, etc.) quando aplicável.
              </span>
            </li>
          </ul>
        </Card>
      </div>

      <div>
        <h2 className="text-title mb-4 flex items-center gap-2 text-[var(--text-primary)]">
          <Key className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
          Chaves por workspace
        </h2>
        {memberships.length === 0 ? (
          <Card padding="lg">
            <p className="text-sm text-[var(--text-secondary)]">
              Sem workspaces.{' '}
              <Link href="/dashboard/workspaces/new" className={dashLink}>
                Criar workspace
              </Link>
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {memberships.map((m) => {
              const admin = canManageKeys(m.role as TenantRole)
              return (
                <Card key={m.tenantId} padding="lg">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {m.tenant.name}
                      </h3>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Papel: {m.role}
                      </p>
                    </div>
                    <Shield
                      className={`h-5 w-5 shrink-0 ${admin ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'}`}
                      strokeWidth={1.5}
                    />
                  </div>
                  {admin ? (
                    <Link
                      href={`/dashboard/workspaces/${m.tenantId}/settings`}
                      className={`${dashBtnSecondary} w-full justify-center text-sm`}
                    >
                      Gerir chaves de API
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
                    </Link>
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Apenas administradores podem adicionar chaves. Peça a um owner/admin
                      do workspace.
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Card padding="lg" className="border-dashed">
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          Integrações sociais e media
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          OAuth (Instagram, YouTube, etc.) e armazenamento S3/R2 continuam em{' '}
          <Link href="/dashboard/integrations" className={dashLink}>
            Integrações
          </Link>
          . Este hub cobre sobretudo <strong>fornecedores de modelo (LLM)</strong>.
        </p>
      </Card>
    </div>
  )
}

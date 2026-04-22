/**
 * Lista de influenciadores AI por workspace.
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Sparkles, GitBranch } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InfluencersPage() {
  const session = await getAuthSession()
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: { tenantId: string }) => tm.tenantId)

  const influencers = await prisma.aIInfluencer.findMany({
    where: { tenantId: { in: tenantIds } },
    include: {
      tenant: { select: { id: true, name: true } },
      currentVersion: {
        select: { version: true, status: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const byWorkspace = tenantMemberships.map((m: { tenant: { id: string; name: string } }) => ({
    workspace: m.tenant,
    influencers: influencers.filter((i) => i.tenantId === m.tenant.id),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-violet-500" />
            Influenciadores AI
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
            Identidade versionada para geração consistente de conteúdo (rosto, voz, persona,
            blueprints). Cada influenciador tem versões reprodutíveis.
          </p>
        </div>
        <Link
          href="/dashboard/influencers/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Novo influenciador
        </Link>
      </div>

      {influencers.length === 0 ? (
        <div className="rounded-xl border border-gray-200/80 dark:border-white/10 p-12 text-center bg-white/60 dark:bg-zinc-950/60">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ainda não há influenciadores neste conta.
          </p>
          <Link
            href="/dashboard/influencers/new"
            className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
          >
            Criar o primeiro
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {byWorkspace.map(({ workspace, influencers: list }) =>
            list.length === 0 ? null : (
              <section key={workspace.id}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  {workspace.name}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((inf) => (
                    <li key={inf.id}>
                      <Link
                        href={`/dashboard/influencers/${inf.id}`}
                        className="block rounded-xl border border-gray-200/80 dark:border-white/10 p-4 bg-white/70 dark:bg-zinc-950/70 hover:border-violet-500/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-black dark:text-white truncate">
                            {inf.name}
                          </p>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                            {inf.status}
                          </span>
                        </div>
                        {inf.currentVersion ? (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <GitBranch className="w-3.5 h-3.5" />
                            v{inf.currentVersion.version} · {inf.currentVersion.status}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">Sem versão atual</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}
        </div>
      )}
    </div>
  )
}

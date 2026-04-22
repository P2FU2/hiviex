/**
 * Fábrica de vídeo — lista de projetos (MVP).
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Clapperboard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VideoFactoryPage() {
  const session = await getAuthSession()
  const memberships = await getUserTenants(session.user.id)
  const tenantIds = memberships.map((m: { tenantId: string }) => m.tenantId)

  const projects = await prisma.videoProject.findMany({
    where: { tenantId: { in: tenantIds } },
    include: {
      tenant: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2">
            <Clapperboard className="w-8 h-8 text-violet-500" />
            Vídeo
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
            Ingestão de fontes, transcrição, análise de cortes, render, legendas (SRT/ffmpeg) e mux
            final com filas BullMQ — gere o pipeline no detalhe de cada projeto.
          </p>
        </div>
        <Link
          href="/dashboard/video/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Novo projeto
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-gray-200/80 dark:border-white/10 p-12 text-center bg-white/60 dark:bg-zinc-950/60">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum projeto de vídeo ainda.</p>
          <Link
            href="/dashboard/video/new"
            className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
          >
            Criar projeto
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/video/${p.id}`}
                className="flex rounded-xl border border-gray-200/80 dark:border-white/10 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 items-center justify-between gap-4 hover:border-violet-500/40 transition-colors"
              >
                <div>
                  <p className="font-medium text-black dark:text-white">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.tenant.name} · {p.status}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded bg-black/5 dark:bg-white/10">
                  {p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

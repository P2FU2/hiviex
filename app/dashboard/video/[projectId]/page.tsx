/**
 * Detalhe do projeto de vídeo — fontes, transcrição e análise (UI).
 */

import { getAuthSession } from '@/lib/auth/session'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { VideoProjectClient } from '@/components/dashboard/video/VideoProjectClient'

export const dynamic = 'force-dynamic'

export default async function VideoProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }> | { projectId: string }
}) {
  const session = await getAuthSession()
  const { projectId } = await Promise.resolve(params)

  const gate = await getVideoProjectForUser(session.user.id, projectId)
  if (!gate.ok) notFound()

  const [sources, candidates, captionTracks] = await Promise.all([
    prisma.videoSource.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        mediaAsset: {
          select: { id: true, fileName: true, cdnUrl: true },
        },
      },
    }),
    prisma.videoClipCandidate.findMany({
      where: { projectId },
      orderBy: { rank: 'asc' },
      select: {
        id: true,
        rank: true,
        startMs: true,
        endMs: true,
        score: true,
        status: true,
        previewMedia: {
          select: { id: true, cdnUrl: true, fileName: true },
        },
      },
    }),
    prisma.captionTrack.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  return (
    <VideoProjectClient
      project={{
        id: gate.project.id,
        title: gate.project.title,
        status: gate.project.status,
        tenantId: gate.project.tenantId,
        config: gate.project.config,
      }}
      initialSources={sources}
      initialCandidates={candidates}
      initialCaptionTracks={captionTracks}
    />
  )
}

import { prisma } from '@/lib/db/prisma'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import type { VideoProject, VideoSource } from '@prisma/client'

export async function getVideoSourceForUser(
  userId: string,
  projectId: string,
  sourceId: string
): Promise<
  | { ok: true; project: VideoProject; source: VideoSource }
  | { ok: false; error: 'NOT_FOUND' | 'FORBIDDEN' | 'SOURCE_NOT_FOUND' }
> {
  const gate = await getVideoProjectForUser(userId, projectId)
  if (!gate.ok) return gate

  const source = await prisma.videoSource.findFirst({
    where: { id: sourceId, projectId },
  })
  if (!source) return { ok: false, error: 'SOURCE_NOT_FOUND' }

  return { ok: true, project: gate.project, source }
}

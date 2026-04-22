import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import type { VideoProject } from '@prisma/client'

export async function getVideoProjectForUser(
  userId: string,
  projectId: string
): Promise<
  | { ok: true; project: VideoProject }
  | { ok: false; error: 'NOT_FOUND' | 'FORBIDDEN' }
> {
  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
  })
  if (!project) return { ok: false, error: 'NOT_FOUND' }
  const allowed = await hasTenantPermission(userId, project.tenantId, 'MEMBER')
  if (!allowed) return { ok: false, error: 'FORBIDDEN' }
  return { ok: true, project }
}

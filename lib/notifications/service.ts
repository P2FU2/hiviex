import { prisma } from '@/lib/db/prisma'

export async function createTenantNotification(opts: {
  tenantId: string
  type: string
  message: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  await prisma.notification.create({
    data: {
      tenantId: opts.tenantId,
      type: opts.type,
      message: opts.message,
      metadata: (opts.metadata ?? {}) as object,
    },
  })
}

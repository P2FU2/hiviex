/**
 * Gera URL presignada PUT para upload direto ao bucket (S3 / R2).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import {
  assertAllowedMimeType,
  buildTenantMediaKey,
  isObjectStorageConfigured,
  maxUploadBytes,
  presignPutUpload,
} from '@/lib/storage/object-storage'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  tenantId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  fileSize: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    if (!isObjectStorageConfigured()) {
      return NextResponse.json(
        {
          error:
            'Armazenamento não configurado. Defina S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e opcionalmente S3_ENDPOINT (R2) e S3_PUBLIC_BASE_URL.',
        },
        { status: 503 }
      )
    }

    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, fileName, mimeType, fileSize } = parsed.data

    const memberships = await getUserTenants(session.user.id)
    const allowed = memberships.some(
      (m: { tenantId: string }) => m.tenantId === tenantId
    )
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const max = maxUploadBytes()
    if (fileSize > max) {
      return NextResponse.json(
        { error: `Ficheiro demasiado grande (máx. ${max} bytes)` },
        { status: 400 }
      )
    }

    try {
      assertAllowedMimeType(mimeType)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'MIME inválido' },
        { status: 400 }
      )
    }

    const s3Key = buildTenantMediaKey(tenantId, fileName)
    const { url, bucket } = await presignPutUpload(s3Key, mimeType)

    return NextResponse.json({
      uploadUrl: url,
      method: 'PUT' as const,
      headers: {
        'Content-Type': mimeType,
      },
      s3Key,
      bucket,
      maxBytes: max,
    })
  } catch (error) {
    console.error('media presign error:', error)
    return NextResponse.json(
      { error: 'Falha ao gerar URL de upload' },
      { status: 500 }
    )
  }
}

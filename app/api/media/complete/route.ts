/**
 * Confirma upload (HeadObject) e cria registo MediaAsset.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MediaType } from '@prisma/client'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import {
  assertAllowedMimeType,
  headObjectMeta,
  isObjectStorageConfigured,
  maxUploadBytes,
  publicUrlForStorageKey,
} from '@/lib/storage/object-storage'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  tenantId: z.string().min(1),
  s3Key: z.string().min(1).max(1024),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  fileSize: z.number().int().positive(),
})

function mimeToMediaType(mime: string): MediaType {
  const m = mime.toLowerCase().split(';')[0].trim()
  if (m.startsWith('image/')) return MediaType.IMAGE
  if (m.startsWith('video/')) return MediaType.VIDEO
  if (m.startsWith('audio/')) return MediaType.AUDIO
  return MediaType.DOCUMENT
}

export async function POST(request: NextRequest) {
  try {
    if (!isObjectStorageConfigured()) {
      return NextResponse.json(
        { error: 'Armazenamento não configurado.' },
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

    const { tenantId, s3Key, fileName, mimeType, fileSize } = parsed.data

    const prefix = `tenants/${tenantId}/media/`
    if (!s3Key.startsWith(prefix)) {
      return NextResponse.json(
        { error: 'Chave de objeto inválida para este workspace' },
        { status: 400 }
      )
    }

    const memberships = await getUserTenants(session.user.id)
    const allowed = memberships.some(
      (m: { tenantId: string }) => m.tenantId === tenantId
    )
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const max = maxUploadBytes()
    if (fileSize > max) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande' }, { status: 400 })
    }

    try {
      assertAllowedMimeType(mimeType)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'MIME inválido' },
        { status: 400 }
      )
    }

    let head: { contentLength: number | undefined; contentType: string | undefined }
    try {
      head = await headObjectMeta(s3Key)
    } catch {
      return NextResponse.json(
        { error: 'Objeto não encontrado no bucket — conclua o upload PUT primeiro.' },
        { status: 400 }
      )
    }

    if (
      head.contentLength != null &&
      Math.abs(head.contentLength - fileSize) > 1
    ) {
      return NextResponse.json(
        {
          error: `Tamanho no bucket (${head.contentLength}) não coincide com o declarado (${fileSize}).`,
        },
        { status: 400 }
      )
    }

    const cdnUrl = publicUrlForStorageKey(s3Key)

    const asset = await prisma.mediaAsset.create({
      data: {
        tenantId,
        fileName,
        fileSize: head.contentLength ?? fileSize,
        mimeType,
        mediaType: mimeToMediaType(mimeType),
        s3Key,
        s3Bucket: process.env.S3_BUCKET?.trim() || null,
        cdnUrl,
      },
    })

    return NextResponse.json({
      asset: {
        id: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        mediaType: asset.mediaType,
        fileSize: asset.fileSize,
        s3Key: asset.s3Key,
        cdnUrl: asset.cdnUrl,
        createdAt: asset.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('media complete error:', error)
    return NextResponse.json(
      { error: 'Falha ao registar mídia' },
      { status: 500 }
    )
  }
}

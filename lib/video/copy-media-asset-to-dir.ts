/**
 * Copia bytes de MediaAsset (S3) para um ficheiro dentro de um diretório temporário.
 */

import path from 'path'
import { writeFile } from 'fs/promises'
import { prisma } from '@/lib/db/prisma'
import { getObjectBufferLimited, isObjectStorageConfigured } from '@/lib/storage/object-storage'

const DEFAULT_MAX = 500 * 1024 * 1024

export function renderMaxInputBytes(): number {
  const raw = process.env.RENDER_MAX_INPUT_BYTES?.trim()
  if (raw && /^\d+$/.test(raw)) {
    const n = parseInt(raw, 10)
    if (n > 0) return n
  }
  return DEFAULT_MAX
}

export function extFromMime(mime: string): string {
  const m = mime.toLowerCase().split(';')[0].trim()
  if (m.includes('quicktime')) return '.mov'
  if (m.includes('webm')) return '.webm'
  if (m.includes('mpeg')) return '.mpeg'
  if (m.includes('mp4')) return '.mp4'
  if (m.includes('mp3')) return '.mp3'
  if (m.includes('wav')) return '.wav'
  if (m.includes('aac') || m.includes('audio/mp4')) return '.m4a'
  return '.bin'
}

export async function copyMediaAssetIntoDir(params: {
  tenantId: string
  mediaAssetId: string
  dir: string
  /** Nome do ficheiro (ex. v.mp4) */
  fileName: string
}): Promise<void> {
  if (!isObjectStorageConfigured()) {
    throw new Error('S3/R2 não configurado.')
  }
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: params.mediaAssetId, tenantId: params.tenantId },
  })
  if (!asset) {
    throw new Error('MediaAsset não encontrado neste workspace.')
  }
  const buf = await getObjectBufferLimited(asset.s3Key, renderMaxInputBytes())
  await writeFile(path.join(params.dir, params.fileName), buf)
}

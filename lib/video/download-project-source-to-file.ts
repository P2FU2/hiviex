/**
 * Escreve a primeira fonte utilizável do projeto num ficheiro temporário (para ffmpeg).
 */

import { mkdtemp, writeFile, rm } from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'
import { prisma } from '@/lib/db/prisma'
import {
  getObjectBufferLimited,
  isObjectStorageConfigured,
} from '@/lib/storage/object-storage'
import { fetchUrlBufferLimited } from '@/lib/video/fetch-media-buffer'

const DEFAULT_MAX = 500 * 1024 * 1024

function maxInputBytes(): number {
  const raw = process.env.RENDER_MAX_INPUT_BYTES?.trim()
  if (raw && /^\d+$/.test(raw)) {
    const n = parseInt(raw, 10)
    if (n > 0) return n
  }
  return DEFAULT_MAX
}

function extFromMime(mime: string | undefined, fallback: string): string {
  const m = (mime || '').toLowerCase().split(';')[0].trim()
  if (m.includes('quicktime')) return '.mov'
  if (m.includes('webm')) return '.webm'
  if (m.includes('mpeg')) return '.mpeg'
  if (m.includes('mp4')) return '.mp4'
  return fallback
}

export type TempInputDir = {
  dir: string
  inputPath: string
  dispose: () => Promise<void>
}

/**
 * Cria diretório temporário com um ficheiro de entrada. Chamar `dispose()` no finally.
 */
export async function downloadProjectSourceToTempFile(
  projectId: string
): Promise<TempInputDir> {
  const maxBytes = maxInputBytes()
  const sources = await prisma.videoSource.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    include: { mediaAsset: true },
  })

  let buffer: Buffer | null = null
  let ext = '.mp4'

  for (const s of sources) {
    if (s.mediaAsset) {
      ext = extFromMime(s.mediaAsset.mimeType, ext)
      if (isObjectStorageConfigured()) {
        buffer = await getObjectBufferLimited(s.mediaAsset.s3Key, maxBytes)
        break
      }
      if (s.mediaAsset.cdnUrl && /^https:\/\//i.test(s.mediaAsset.cdnUrl.trim())) {
        buffer = await fetchUrlBufferLimited(s.mediaAsset.cdnUrl.trim(), maxBytes)
        break
      }
    } else if (s.sourceUrl && /^https:\/\//i.test(s.sourceUrl.trim())) {
      buffer = await fetchUrlBufferLimited(s.sourceUrl.trim(), maxBytes)
      break
    }
  }

  if (!buffer) {
    throw new Error(
      'Nenhuma fonte de vídeo utilizável (upload S3/R2, CDN HTTPS ou URL pública).'
    )
  }

  const dir = await mkdtemp(path.join(tmpdir(), 'hiviex-clip-'))
  const inputPath = path.join(dir, `source${ext}`)
  await writeFile(inputPath, buffer)

  return {
    dir,
    inputPath,
    dispose: async () => {
      await rm(dir, { recursive: true, force: true }).catch(() => {})
    },
  }
}

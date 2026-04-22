/**
 * S3 / Cloudflare R2 — cliente, presign PUT e URL pública para CDNs.
 *
 * Variáveis: S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 * AWS_REGION (ou "auto" no R2), S3_ENDPOINT (R2), S3_PUBLIC_BASE_URL ou CDN_URL.
 */

import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

export type ObjectStorageConfig = {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  publicBase?: string
}

export function readObjectStorageConfig(): ObjectStorageConfig | null {
  const bucket = process.env.S3_BUCKET?.trim()
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()
  if (!bucket || !accessKeyId || !secretAccessKey) {
    return null
  }
  const region = process.env.AWS_REGION?.trim() || 'auto'
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined
  const publicBase =
    process.env.S3_PUBLIC_BASE_URL?.trim() ||
    process.env.CDN_URL?.trim() ||
    undefined
  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    publicBase,
  }
}

export function isObjectStorageConfigured(): boolean {
  return readObjectStorageConfig() !== null
}

export function createS3Client(cfg: ObjectStorageConfig): S3Client {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: !!cfg.endpoint,
  })
}

/** URL HTTPS pública para a chave (obrigatória para Instagram Graph: image_url / video_url). */
export function publicUrlForStorageKey(
  s3Key: string,
  cfg: ObjectStorageConfig | null = readObjectStorageConfig()
): string | null {
  const base = cfg?.publicBase?.replace(/\/$/, '')
  if (!base) return null
  return `${base}/${s3Key.split('/').map(encodeURIComponent).join('/')}`
}

export function maxUploadBytes(): number {
  const raw = process.env.MAX_MEDIA_UPLOAD_BYTES?.trim()
  if (raw && /^\d+$/.test(raw)) {
    const n = parseInt(raw, 10)
    if (n > 0) return n
  }
  return 500 * 1024 * 1024
}

const ALLOWED_UPLOAD_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'application/pdf',
])

export function assertAllowedMimeType(mimeType: string): void {
  const m = mimeType.toLowerCase().split(';')[0].trim()
  if (!ALLOWED_UPLOAD_MIMES.has(m)) {
    throw new Error(`Tipo MIME não permitido: ${mimeType}`)
  }
}

export function safeFileSegment(fileName: string): string {
  const base = fileName.replace(/^.*[/\\]/, '').slice(0, 160)
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_')
  return cleaned.length > 0 ? cleaned : 'file'
}

export function buildTenantMediaKey(tenantId: string, fileName: string): string {
  const id = randomUUID()
  const seg = safeFileSegment(fileName)
  return `tenants/${tenantId}/media/${id}-${seg}`
}

export async function presignPutUpload(
  s3Key: string,
  contentType: string,
  expiresSeconds = 3600
): Promise<{ url: string; bucket: string }> {
  const cfg = readObjectStorageConfig()
  if (!cfg) {
    throw new Error('Armazenamento de objetos não configurado (S3/R2).')
  }
  const client = createS3Client(cfg)
  const cmd = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: s3Key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(client, cmd, { expiresIn: expiresSeconds })
  return { url, bucket: cfg.bucket }
}

export async function headObjectMeta(
  s3Key: string
): Promise<{ contentLength: number | undefined; contentType: string | undefined }> {
  const cfg = readObjectStorageConfig()
  if (!cfg) {
    throw new Error('Armazenamento de objetos não configurado (S3/R2).')
  }
  const client = createS3Client(cfg)
  const out = await client.send(
    new HeadObjectCommand({ Bucket: cfg.bucket, Key: s3Key })
  )
  return {
    contentLength: out.ContentLength,
    contentType: out.ContentType,
  }
}

/** Resolve URL usada pelos providers sociais (HTTPS). */
export function resolveAssetPublicUrl(asset: {
  cdnUrl?: string | null
  s3Key: string
}): string {
  const direct = asset.cdnUrl?.trim()
  if (direct && /^https?:\/\//i.test(direct)) {
    return direct
  }
  const fromKey = publicUrlForStorageKey(asset.s3Key)
  if (fromKey) return fromKey
  return asset.cdnUrl || asset.s3Key
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  UploadCloud,
  ExternalLink,
  FileImage,
  Loader2,
  RefreshCw,
} from 'lucide-react'

type Tenant = { id: string; name: string; slug: string }

type MediaRow = {
  id: string
  fileName: string
  mimeType: string
  mediaType: string
  fileSize: number
  s3Key: string
  cdnUrl: string | null
  thumbnailUrl: string | null
  createdAt: string
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function inferMime(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  }
  return map[ext || ''] || 'application/octet-stream'
}

export default function MediaLibraryPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [workspaceId, setWorkspaceId] = useState('')
  const [assets, setAssets] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageHint, setStorageHint] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadAssets = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(
        `/api/media?tenantId=${encodeURIComponent(workspaceId)}`
      )
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Falha ao carregar')
        setAssets([])
        return
      }
      setAssets(Array.isArray(data.assets) ? data.assets : [])
    } catch {
      setError('Erro de rede')
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.tenants || []).map(
          (m: { tenant: Tenant }) => m.tenant
        ) as Tenant[]
        setTenants(list)
        if (list[0]?.id) setWorkspaceId(list[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  const onPickFile = async (file: File | null) => {
    if (!file || !workspaceId) return
    setUploading(true)
    setError(null)
    setStorageHint(null)
    try {
      const mimeType = inferMime(file)
      const presignRes = await fetch('/api/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: workspaceId,
          fileName: file.name,
          mimeType,
          fileSize: file.size,
        }),
      })
      const presignJson = await presignRes.json()
      if (!presignRes.ok) {
        setError(presignJson.error || 'Presign falhou')
        if (presignRes.status === 503) {
          setStorageHint(
            'Configure S3 ou Cloudflare R2 no servidor (.env). Ver .env.example.'
          )
        }
        return
      }

      const { uploadUrl, headers, s3Key } = presignJson
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          ...(headers as Record<string, string>),
        },
        body: file,
      })
      if (!putRes.ok) {
        setError(
          `Upload ao bucket falhou (${putRes.status}). Verifique CORS do bucket para o origin ${typeof window !== 'undefined' ? window.location.origin : ''}.`
        )
        return
      }

      const completeRes = await fetch('/api/media/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: workspaceId,
          s3Key,
          fileName: file.name,
          mimeType,
          fileSize: file.size,
        }),
      })
      const completeJson = await completeRes.json()
      if (!completeRes.ok) {
        setError(completeJson.error || 'Registo da mídia falhou')
        return
      }

      await loadAssets()
    } catch {
      setError('Erro durante o upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="dashboard-app min-h-screen p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Fase 8 — Armazenamento
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-black dark:text-white flex items-center gap-2 mt-1">
            <FileImage className="w-8 h-8 text-violet-500" />
            Biblioteca de mídia
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-xl">
            Upload direto para S3 ou R2 (presign). Os ficheiros ficam em{' '}
            <code className="text-xs bg-black/5 dark:bg-white/10 px-1 rounded">
              MediaAsset
            </code>{' '}
            e podem ser referenciados ao agendar posts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/calendar"
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
          >
            Calendário editorial
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard/integrations"
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
          >
            Integrações
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 px-3 py-2">
          <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="bg-transparent text-sm text-black dark:text-white outline-none min-w-[200px]"
          >
            {tenants.length === 0 ? (
              <option value="">Carregar workspaces…</option>
            ) : (
              tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))
            )}
          </select>
        </div>
        <button
          type="button"
          onClick={() => loadAssets()}
          disabled={loading || !workspaceId}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200/80 dark:border-white/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div
        className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 bg-white/40 dark:bg-zinc-950/40 px-6 py-10 text-center cursor-pointer hover:border-violet-400/60 transition-colors"
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            !uploading && inputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
          disabled={uploading || !workspaceId}
          onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
        />
        {uploading ? (
          <Loader2 className="w-10 h-10 mx-auto text-violet-500 animate-spin" />
        ) : (
          <UploadCloud className="w-10 h-10 mx-auto text-violet-500" />
        )}
        <p className="mt-3 text-sm font-medium text-black dark:text-white">
          {uploading ? 'A enviar…' : 'Clique para escolher ficheiro'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          JPEG, PNG, WebP, GIF, MP4, MOV — até ao limite configurado no servidor.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {error}
          {storageHint ? (
            <p className="mt-2 text-xs opacity-90">{storageHint}</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200/60 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50">
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Ficheiros recentes
          </h2>
        </div>
        {loading && assets.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">A carregar…</p>
        ) : assets.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            Nenhum ficheiro neste workspace.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200/60 dark:divide-white/10">
            {assets.map((a) => (
              <li
                key={a.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-black dark:text-white truncate">
                    {a.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.mediaType} · {a.mimeType} · {formatBytes(a.fileSize)}
                  </p>
                  <code className="text-[10px] text-gray-400 break-all">
                    id: {a.id}
                  </code>
                </div>
                {a.cdnUrl ? (
                  <a
                    href={a.cdnUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs text-violet-600 dark:text-violet-400 inline-flex items-center gap-1"
                  >
                    Abrir URL pública
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                    Defina S3_PUBLIC_BASE_URL para URL pública
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

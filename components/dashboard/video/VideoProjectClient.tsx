'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Film,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Scissors,
  Subtitles,
  Trash2,
  X,
} from 'lucide-react'
import { SchedulePostForm } from '@/components/dashboard/SchedulePostForm'

type SourceRow = {
  id: string
  type: string
  sourceUrl: string | null
  ingestStatus: string
  mediaAsset: {
    id: string
    fileName: string
    cdnUrl: string | null
  } | null
}

type CandidateRow = {
  id: string
  rank: number
  startMs: number
  endMs: number
  score: number | null
  status: string
  previewMedia?: {
    id: string
    cdnUrl: string | null
    fileName: string
  } | null
}

type JobRow = {
  id: string
  type: string
  status: string
  createdAt: string
  error: string | null
}

type CaptionTrackRow = {
  id: string
  locale: string
  stylePreset: string | null
  segments: unknown
}

type MediaPickItem = {
  id: string
  fileName: string
  mediaType: string
  cdnUrl: string | null
}

const DEFAULT_SEGMENTS = `[
  { "startMs": 0, "endMs": 2000, "text": "Olá!" },
  { "startMs": 2000, "endMs": 5000, "text": "Isto é um exemplo de legenda." }
]`

function jobStatusPillClass(status: string) {
  const s = status.toUpperCase()
  if (s === 'COMPLETED') {
    return 'bg-emerald-500/12 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20'
  }
  if (s === 'FAILED') {
    return 'bg-red-500/10 text-red-800 dark:text-red-200 border border-red-500/20'
  }
  if (s === 'RUNNING' || s === 'PENDING' || s === 'QUEUED') {
    return 'bg-sky-500/12 text-sky-900 dark:text-sky-200 border border-sky-500/25'
  }
  return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/20'
}

export function VideoProjectClient(props: {
  project: {
    id: string
    title: string
    status: string
    tenantId: string
    config: unknown
  }
  initialSources: SourceRow[]
  initialCandidates: CandidateRow[]
  initialCaptionTracks: CaptionTrackRow[]
}) {
  const { project, initialSources, initialCandidates, initialCaptionTracks } = props
  const router = useRouter()
  const [sources, setSources] = useState(initialSources)
  const [candidates, setCandidates] = useState(initialCandidates)
  const [url, setUrl] = useState('')
  const [uploadAssetId, setUploadAssetId] = useState('')
  const [mediaPicklist, setMediaPicklist] = useState<MediaPickItem[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setErrorState] = useState<string | null>(null)
  const [info, setInfoState] = useState<string | null>(null)
  const setError = useCallback((msg: string | null) => {
    setErrorState(msg)
    if (msg) setInfoState(null)
  }, [])
  const setInfo = useCallback((msg: string | null) => {
    setInfoState(msg)
    if (msg) setErrorState(null)
  }, [])
  const [titleDraft, setTitleDraft] = useState(project.title)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [captionTracks, setCaptionTracks] = useState(initialCaptionTracks)
  const [captionTrackId, setCaptionTrackId] = useState<string | null>(
    initialCaptionTracks[0]?.id ?? null
  )
  const [segmentsJson, setSegmentsJson] = useState(
    initialCaptionTracks[0]
      ? JSON.stringify(initialCaptionTracks[0].segments, null, 2)
      : DEFAULT_SEGMENTS
  )
  const [captionVideoAssetId, setCaptionVideoAssetId] = useState('')
  const [finalVideoAssetId, setFinalVideoAssetId] = useState('')
  const [finalAudioAssetId, setFinalAudioAssetId] = useState('')
  const [finalAudioUrl, setFinalAudioUrl] = useState('')
  const fetchedConfigMediaRef = useRef<Set<string>>(new Set())
  const [resolvedConfigCdn, setResolvedConfigCdn] = useState<
    Record<string, string | null>
  >({})

  const projectConfig = project.config as {
    finalMediaAssetId?: string
    lastCaptionMediaAssetId?: string
  } | null

  const firstRenderedPreviewId = useMemo(() => {
    const c = initialCandidates.find(
      (x) => x.status === 'RENDERED' && x.previewMedia?.id
    )
    return c?.previewMedia?.id ?? ''
  }, [initialCandidates])

  const videoLibrary = useMemo(
    () => mediaPicklist.filter((m) => m.mediaType === 'VIDEO'),
    [mediaPicklist]
  )
  const audioLibrary = useMemo(
    () => mediaPicklist.filter((m) => m.mediaType === 'AUDIO'),
    [mediaPicklist]
  )

  const configAssetCdn = useCallback(
    (id: string | undefined) => {
      if (!id) return null
      const fromPicklist = mediaPicklist.find((m) => m.id === id)?.cdnUrl
      if (fromPicklist) return fromPicklist
      if (Object.prototype.hasOwnProperty.call(resolvedConfigCdn, id)) {
        return resolvedConfigCdn[id]
      }
      return null
    },
    [mediaPicklist, resolvedConfigCdn]
  )

  useEffect(() => {
    fetchedConfigMediaRef.current.clear()
    setResolvedConfigCdn({})
  }, [project.id])

  useEffect(() => {
    const ids = [
      projectConfig?.finalMediaAssetId,
      projectConfig?.lastCaptionMediaAssetId,
    ].filter((x): x is string => !!x)
    for (const id of ids) {
      const hasCdnInList = mediaPicklist.some((m) => m.id === id && m.cdnUrl)
      if (hasCdnInList) continue
      if (fetchedConfigMediaRef.current.has(id)) continue
      fetchedConfigMediaRef.current.add(id)
      void fetch(
        `/api/media/${encodeURIComponent(id)}?tenantId=${encodeURIComponent(project.tenantId)}`
      )
        .then(async (r) => {
          if (!r.ok) return null
          return r.json() as Promise<{ asset?: { cdnUrl: string | null } }>
        })
        .then((d) => {
          const url = d?.asset?.cdnUrl ?? null
          setResolvedConfigCdn((p) => ({ ...p, [id]: url }))
        })
        .catch(() => {
          setResolvedConfigCdn((p) => ({ ...p, [id]: null }))
        })
    }
  }, [
    project.id,
    project.tenantId,
    projectConfig?.finalMediaAssetId,
    projectConfig?.lastCaptionMediaAssetId,
    mediaPicklist,
  ])

  useEffect(() => {
    setCaptionTracks(initialCaptionTracks)
  }, [initialCaptionTracks])

  useEffect(() => {
    if (firstRenderedPreviewId) {
      setCaptionVideoAssetId((prev) => prev || firstRenderedPreviewId)
      setFinalVideoAssetId((prev) => prev || firstRenderedPreviewId)
    }
  }, [firstRenderedPreviewId])

  useEffect(() => {
    setTitleDraft(project.title)
  }, [project.title])

  useEffect(() => {
    fetch(`/api/media?tenantId=${encodeURIComponent(project.tenantId)}&take=40`)
      .then((r) => r.json())
      .then((d) => setMediaPicklist((d.assets ?? []) as MediaPickItem[]))
      .catch(() => {})
  }, [project.tenantId])

  useEffect(() => {
    setSources(initialSources)
    setCandidates(initialCandidates)
  }, [initialSources, initialCandidates])

  async function refreshLists() {
    const sRes = await fetch(`/api/video/projects/${project.id}/sources`)
    if (sRes.ok) {
      const sJson = await sRes.json()
      setSources((sJson.sources ?? []) as SourceRow[])
    }
  }

  const refreshJobs = useCallback(async () => {
    const r = await fetch(`/api/video/projects/${project.id}/generation-jobs?take=25`)
    if (r.ok) {
      const j = await r.json()
      setJobs((j.jobs ?? []) as JobRow[])
    }
  }, [project.id])

  useEffect(() => {
    void refreshJobs()
  }, [refreshJobs])

  async function addUrlSource() {
    if (!url.trim()) {
      setError('Indica uma URL.')
      return
    }
    setBusy('url')
    setError(null)
    try {
      const res = await fetch(`/api/video/projects/${project.id}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'URL', sourceUrl: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao criar fonte')
        return
      }
      setUrl('')
      await refreshLists()
      await refreshJobs()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function addUploadSource() {
    if (!uploadAssetId) {
      setError('Escolhe um ficheiro da biblioteca.')
      return
    }
    setBusy('upload')
    setError(null)
    try {
      const res = await fetch(`/api/video/projects/${project.id}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UPLOAD', mediaAssetId: uploadAssetId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao criar fonte')
        return
      }
      setUploadAssetId('')
      await refreshLists()
      await refreshJobs()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function transcribe(sourceId: string) {
    setBusy(`tr-${sourceId}`)
    setError(null)
    try {
      const res = await fetch(
        `/api/video/projects/${project.id}/sources/${sourceId}/transcribe`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha na transcrição')
        return
      }
      setInfo(`Transcrição enfileirada (job: ${data.generationJobId ?? data.bullJobId ?? ''}).`)
      await refreshLists()
      await refreshJobs()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function analyzeClips(sourceId?: string) {
    setBusy('clips')
    setError(null)
    try {
      const res = await fetch(`/api/video/projects/${project.id}/analyze-clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha na análise')
        return
      }
      setInfo(`Análise de cortes enfileirada (job: ${data.generationJobId ?? data.bullJobId ?? ''}).`)
      await refreshJobs()
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function saveTitle() {
    const t = titleDraft.trim()
    if (!t || t === project.title) return
    setBusy('title')
    setError(null)
    try {
      const res = await fetch(`/api/video/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao guardar título')
        return
      }
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function postRenderClip(candidateId: string) {
    setBusy(`render-${candidateId}`)
    setError(null)
    try {
      const res = await fetch(
        `/api/video/projects/${project.id}/clip-candidates/${candidateId}/render`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha no render')
        return
      }
      setInfo(`Render enfileirado (job: ${data.generationJobId ?? data.bullJobId ?? ''}).`)
      await refreshJobs()
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  function parseSegmentsForSave(): unknown[] | null {
    let segments: unknown
    try {
      segments = JSON.parse(segmentsJson)
    } catch {
      setError('JSON de segmentos inválido.')
      return null
    }
    if (!Array.isArray(segments)) {
      setError('Os segmentos têm de ser um array.')
      return null
    }
    return segments
  }

  function selectCaptionTrack(id: string) {
    if (!id) {
      setCaptionTrackId(null)
      setSegmentsJson(DEFAULT_SEGMENTS)
      return
    }
    const t = captionTracks.find((x) => x.id === id)
    setCaptionTrackId(id)
    setSegmentsJson(t ? JSON.stringify(t.segments, null, 2) : DEFAULT_SEGMENTS)
  }

  async function saveCaptions() {
    const segments = parseSegmentsForSave()
    if (!segments) return
    if (segments.length < 1) {
      setError('Precisa de pelo menos um segmento.')
      return
    }
    setBusy('cap-save')
    setError(null)
    try {
      if (captionTrackId) {
        const res = await fetch(
          `/api/video/projects/${project.id}/captions/${captionTrackId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ segments }),
          }
        )
        const data = await res.json()
        if (!res.ok) {
          setError(typeof data.error === 'string' ? data.error : 'Falha ao guardar legendas')
          return
        }
        setCaptionTracks((prev) =>
          prev.map((t) => (t.id === captionTrackId ? { ...t, segments: data.segments } : t))
        )
        setInfo('Legendas guardadas.')
      } else {
        const res = await fetch(`/api/video/projects/${project.id}/captions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: 'pt-BR', segments }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(typeof data.error === 'string' ? data.error : 'Falha ao criar faixa')
          return
        }
        setCaptionTrackId(data.id)
        setCaptionTracks((prev) => [
          {
            id: data.id,
            locale: data.locale,
            stylePreset: data.stylePreset,
            segments: data.segments,
          },
          ...prev.filter((x) => x.id !== data.id),
        ])
        setInfo('Faixa de legendas criada.')
      }
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function postCaptionRender() {
    if (!captionTrackId) {
      setError('Cria ou escolhe uma faixa de legendas primeiro.')
      return
    }
    const vid = captionVideoAssetId.trim()
    if (!vid) {
      setError('Indica o MediaAsset de vídeo para queimar legendas.')
      return
    }
    setBusy('cap-render')
    setError(null)
    try {
      const res = await fetch(
        `/api/video/projects/${project.id}/captions/${captionTrackId}/render`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceMediaAssetId: vid }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha no render de legendas')
        return
      }
      setInfo(
        `Queima de legendas enfileirada (job: ${data.generationJobId ?? data.bullJobId ?? ''}).`
      )
      await refreshJobs()
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function postFinalExport() {
    const vid = finalVideoAssetId.trim()
    if (!vid) {
      setError('Indica o vídeo principal para o export final.')
      return
    }
    const body: {
      videoMediaAssetId: string
      audioMediaAssetId?: string
      audioUrl?: string
    } = { videoMediaAssetId: vid }
    const aid = finalAudioAssetId.trim()
    if (aid) body.audioMediaAssetId = aid
    const u = finalAudioUrl.trim()
    if (u) body.audioUrl = u

    setBusy('final-mux')
    setError(null)
    try {
      const res = await fetch(`/api/video/projects/${project.id}/export/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha no export final')
        return
      }
      setInfo(
        `Export final enfileirado (job: ${data.generationJobId ?? data.bullJobId ?? ''}). O projeto fica em RENDERING até concluir.`
      )
      await refreshJobs()
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function deleteCaptionTrack() {
    if (!captionTrackId) return
    if (!globalThis.confirm('Apagar esta faixa de legendas? Esta ação não pode ser desfeita.')) {
      return
    }
    setBusy('cap-del')
    setError(null)
    try {
      const res = await fetch(
        `/api/video/projects/${project.id}/captions/${captionTrackId}`,
        { method: 'DELETE' }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao apagar faixa')
        return
      }
      const removed = captionTrackId
      setCaptionTracks((prev) => {
        const filtered = prev.filter((t) => t.id !== removed)
        if (filtered[0]) {
          setCaptionTrackId(filtered[0].id)
          setSegmentsJson(JSON.stringify(filtered[0].segments, null, 2))
        } else {
          setCaptionTrackId(null)
          setSegmentsJson(DEFAULT_SEGMENTS)
        }
        return filtered
      })
      setInfo('Faixa de legendas removida.')
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function setCandidateStatus(candidateId: string, status: 'APPROVED' | 'REJECTED') {
    setBusy(`cand-${candidateId}`)
    setError(null)
    try {
      const res = await fetch(
        `/api/video/projects/${project.id}/clip-candidates/${candidateId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao atualizar')
        return
      }
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: data.status } : c))
      )
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/dashboard/video"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Vídeo
      </Link>

      <header className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <Clapperboard className="w-8 h-8 text-violet-500 shrink-0 sm:mb-1" />
          <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="flex-1 text-2xl sm:text-3xl font-bold text-black dark:text-white bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/15 focus:border-violet-500/50 rounded-lg px-2 py-1"
            />
            <button
              type="button"
              disabled={!!busy || titleDraft.trim() === project.title}
              onClick={() => void saveTitle()}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 disabled:opacity-50"
            >
              {busy === 'title' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar título'}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">Estado: {project.status}</p>
      </header>

      {error ? (
        <p
          role="alert"
          className="text-sm text-red-800 dark:text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
        >
          {error}
        </p>
      ) : null}
      {info ? (
        <p
          className="text-sm text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5"
        >
          {info}
        </p>
      ) : null}

      <section className="rounded-xl border border-gray-200/80 dark:border-white/10 p-4 space-y-4 bg-white/60 dark:bg-zinc-950/60">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Nova fonte
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">URL (vídeo público)</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void addUrlSource()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm disabled:opacity-50 shadow-sm"
          >
            {busy === 'url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            Adicionar URL
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Upload (biblioteca)</label>
            <select
              value={uploadAssetId}
              onChange={(e) => setUploadAssetId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">— Ficheiro —</option>
              {mediaPicklist.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fileName}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void addUploadSource()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-violet-500/40 text-violet-800 dark:text-violet-200 bg-violet-500/5 hover:bg-violet-500/10 text-sm disabled:opacity-50"
          >
            {busy === 'upload' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Adicionar upload
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          disabled={!!busy || sources.length === 0}
          onClick={() => void analyzeClips()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
        >
          {busy === 'clips' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Scissors className="w-4 h-4" />
          )}
          Analisar cortes (projeto)
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void refreshJobs()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar jobs
        </button>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Jobs de geração
        </h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum job registado ainda.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="flex flex-col gap-1.5 rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/50 dark:bg-zinc-950/40 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="font-mono text-xs text-[var(--text-primary,inherit)]">
                    {j.type}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded-md ${jobStatusPillClass(j.status)}`}
                  >
                    {j.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(j.createdAt).toLocaleString()}
                </div>
                {j.error ? (
                  <span className="text-xs text-red-700 dark:text-red-300 line-clamp-2">{j.error}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Fontes
        </h2>
        <ul className="space-y-2">
          {sources.length === 0 ? (
            <li className="text-gray-500 text-sm">Nenhuma fonte.</li>
          ) : (
            sources.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-gray-200/80 dark:border-white/10 px-4 py-3 bg-white/70 dark:bg-zinc-950/70 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {s.type}
                    {s.mediaAsset
                      ? ` · ${s.mediaAsset.fileName}`
                      : s.sourceUrl
                        ? ` · ${s.sourceUrl.slice(0, 64)}…`
                        : ''}
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                    {s.ingestStatus}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void transcribe(s.id)}
                  className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400"
                >
                  {busy === `tr-${s.id}` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Subtitles className="w-3.5 h-3.5" />
                  )}
                  Transcrever
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Candidatos a clip
        </h2>
        <ul className="space-y-2">
          {candidates.length === 0 ? (
            <li className="rounded-xl border border-dashed border-violet-300/60 dark:border-violet-500/30 bg-violet-500/[0.04] px-4 py-5 text-center space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ainda não há segmentos sugeridos. Inicia a análise de cortes para o worker
                detetar momentos.
              </p>
              <button
                type="button"
                disabled={!!busy || sources.length === 0}
                onClick={() => void analyzeClips()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
              >
                {busy === 'clips' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                Analisar cortes
              </button>
              {sources.length === 0 ? (
                <p className="text-xs text-gray-500">Adiciona primeiro uma fonte de vídeo acima.</p>
              ) : null}
            </li>
          ) : (
            candidates.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-gray-200/60 dark:border-white/10 px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  #{c.rank} · {c.startMs}ms – {c.endMs}ms
                  {c.score != null ? ` · score ${c.score.toFixed(2)}` : ''}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">{c.status}</span>
                  {c.previewMedia?.cdnUrl ? (
                    <a
                      href={c.previewMedia.cdnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Ver clip
                    </a>
                  ) : null}
                  {c.status === 'PENDING' ? (
                    <>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void setCandidateStatus(c.id, 'APPROVED')}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-500/10"
                        title="Aprovar"
                      >
                        {busy === `cand-${c.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void setCandidateStatus(c.id, 'REJECTED')}
                        className="p-1 rounded text-red-600 hover:bg-red-500/10"
                        title="Rejeitar"
                      >
                        {busy === `cand-${c.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  ) : null}
                  {c.status === 'APPROVED' ? (
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void postRenderClip(c.id)}
                      className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 px-2 py-1 rounded border border-violet-500/30"
                      title="Enfileirar render (worker)"
                    >
                      {busy === `render-${c.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Film className="w-3.5 h-3.5" />
                      )}
                      Render
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200/80 dark:border-white/10 p-4 space-y-4 bg-white/60 dark:bg-zinc-950/60">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Subtitles className="w-4 h-4" />
          Legendas e export final
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="sm:col-span-2 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[12rem]">
              <label className="block text-xs font-medium mb-1">Faixa de legendas</label>
              <select
                value={captionTrackId ?? ''}
                onChange={(e) => selectCaptionTrack(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="">Nova faixa (guardar cria registo)</option>
                {captionTracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.locale}
                    {t.stylePreset ? ` · ${t.stylePreset}` : ''} · {t.id.slice(0, 8)}…
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => selectCaptionTrack('')}
              className="text-xs px-2 py-2 rounded-lg border border-gray-300 dark:border-white/20"
            >
              Limpar / nova
            </button>
            <button
              type="button"
              disabled={!!busy || !captionTrackId}
              onClick={() => void deleteCaptionTrack()}
              className="inline-flex items-center gap-1 text-xs px-2 py-2 rounded-lg border border-red-500/40 text-red-700 dark:text-red-300 disabled:opacity-50"
              title="Apagar faixa guardada"
            >
              {busy === 'cap-del' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Apagar faixa
            </button>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">Segmentos (JSON)</label>
            <textarea
              value={segmentsJson}
              onChange={(e) => setSegmentsJson(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2"
            />
          </div>

          <button
            type="button"
            disabled={!!busy}
            onClick={() => void saveCaptions()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm disabled:opacity-50 sm:col-span-2"
          >
            {busy === 'cap-save' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar legendas
          </button>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">Vídeo de origem (queimar legendas)</label>
            <select
              value={
                videoLibrary.some((m) => m.id === captionVideoAssetId)
                  ? captionVideoAssetId
                  : ''
              }
              onChange={(e) => setCaptionVideoAssetId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">— Escolher da biblioteca —</option>
              {videoLibrary.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fileName}
                </option>
              ))}
            </select>
            <input
              value={
                videoLibrary.some((m) => m.id === captionVideoAssetId) ? '' : captionVideoAssetId
              }
              onChange={(e) => setCaptionVideoAssetId(e.target.value)}
              placeholder="Ou colar MediaAsset ID (vídeo)"
              className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono"
            />
          </div>

          <button
            type="button"
            disabled={!!busy || !captionTrackId}
            onClick={() => void postCaptionRender()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-violet-500/40 text-violet-700 dark:text-violet-300 text-sm disabled:opacity-50 sm:col-span-2"
          >
            {busy === 'cap-render' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            Enfileirar queima de legendas
          </button>

          {projectConfig?.lastCaptionMediaAssetId ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 sm:col-span-2">
              Último vídeo com legendas (config):{' '}
              <span className="font-mono">{projectConfig.lastCaptionMediaAssetId}</span>
              {configAssetCdn(projectConfig.lastCaptionMediaAssetId) ? (
                <>
                  {' · '}
                  <a
                    href={configAssetCdn(projectConfig.lastCaptionMediaAssetId)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 dark:text-violet-400 underline"
                  >
                    Abrir
                  </a>
                </>
              ) : null}
            </p>
          ) : null}

          <div className="border-t border-gray-200/80 dark:border-white/10 pt-4 sm:col-span-2 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Mux final (vídeo + áudio opcional)
            </p>
            <label className="block text-xs font-medium">Vídeo principal</label>
            <select
              value={
                videoLibrary.some((m) => m.id === finalVideoAssetId) ? finalVideoAssetId : ''
              }
              onChange={(e) => setFinalVideoAssetId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">— Escolher da biblioteca —</option>
              {videoLibrary.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fileName}
                </option>
              ))}
            </select>
            <input
              value={
                videoLibrary.some((m) => m.id === finalVideoAssetId) ? '' : finalVideoAssetId
              }
              onChange={(e) => setFinalVideoAssetId(e.target.value)}
              placeholder="Ou colar MediaAsset ID (vídeo)"
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono"
            />

            <label className="block text-xs font-medium mt-2">Áudio (biblioteca, opcional)</label>
            <select
              value={
                audioLibrary.some((m) => m.id === finalAudioAssetId) ? finalAudioAssetId : ''
              }
              onChange={(e) => setFinalAudioAssetId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">— Nenhum —</option>
              {audioLibrary.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fileName}
                </option>
              ))}
            </select>
            <input
              value={
                audioLibrary.some((m) => m.id === finalAudioAssetId) ? '' : finalAudioAssetId
              }
              onChange={(e) => setFinalAudioAssetId(e.target.value)}
              placeholder="Ou colar MediaAsset ID (áudio)"
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono"
            />

            <label className="block text-xs font-medium mt-2">URL de áudio HTTPS (opcional)</label>
            <input
              value={finalAudioUrl}
              onChange={(e) => setFinalAudioUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />

            <button
              type="button"
              disabled={!!busy || !finalVideoAssetId.trim()}
              onClick={() => void postFinalExport()}
              className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
            >
              {busy === 'final-mux' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clapperboard className="w-4 h-4" />}
              Enfileirar export final
            </button>
          </div>

          {projectConfig?.finalMediaAssetId ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 sm:col-span-2">
              Ficheiro final (config):{' '}
              <span className="font-mono">{projectConfig.finalMediaAssetId}</span>
              {configAssetCdn(projectConfig.finalMediaAssetId) ? (
                <>
                  {' · '}
                  <a
                    href={configAssetCdn(projectConfig.finalMediaAssetId)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 dark:text-violet-400 underline"
                  >
                    Abrir
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      </section>

      <SchedulePostForm
        tenantId={project.tenantId}
        suggestedMediaAssetIds={[
          projectConfig?.finalMediaAssetId,
          projectConfig?.lastCaptionMediaAssetId,
        ].filter((x): x is string => !!x)}
        title={project.title}
      />
      {projectConfig?.finalMediaAssetId ? (
        <p className="text-xs text-gray-500">
          <Link
            href={`/dashboard/calendar?tenantId=${encodeURIComponent(project.tenantId)}&mediaAssetId=${encodeURIComponent(projectConfig.finalMediaAssetId)}`}
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            Abrir calendário com o export final pré-preenchido
          </Link>
        </p>
      ) : null}
    </div>
  )
}

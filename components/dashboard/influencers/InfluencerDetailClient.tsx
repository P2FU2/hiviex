'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  GitBranch,
  Loader2,
  Lock,
  Save,
  Sparkles,
  Trash2,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react'

type VersionSummary = { id: string; version: number; status: string }

type ReferenceRow = {
  id: string
  role: string
  mediaAsset: {
    id: string
    fileName: string
    mimeType: string
    cdnUrl: string | null
    thumbnailUrl: string | null
  }
}

type VersionDetail = {
  id: string
  version: number
  status: string
  identityPack: unknown
  promptBlueprint: string | null
  negativePromptBlueprint: string | null
  notes: string | null
  referenceAssets: ReferenceRow[]
}

export function InfluencerDetailClient(props: {
  influencer: {
    id: string
    name: string
    slug: string | null
    status: string
    tenantId: string
    currentVersionId: string | null
  }
  versionSummaries: VersionSummary[]
  canLock: boolean
}) {
  const { influencer, versionSummaries, canLock } = props
  const [selectedId, setSelectedId] = useState<string | null>(
    influencer.currentVersionId ?? versionSummaries[0]?.id ?? null
  )
  const [detail, setDetail] = useState<VersionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [identityJson, setIdentityJson] = useState('')
  const [promptBp, setPromptBp] = useState('')
  const [negBp, setNegBp] = useState('')
  const [notes, setNotes] = useState('')

  const [mediaAssets, setMediaAssets] = useState<
    { id: string; fileName: string; thumbnailUrl: string | null }[]
  >([])
  const [newRefAssetId, setNewRefAssetId] = useState('')
  const [newRefRole, setNewRefRole] = useState('OTHER')

  const [busy, setBusy] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const loadVersion = useCallback(async (versionId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/influencers/${influencer.id}/versions/${versionId}`)
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao carregar versão')
        setDetail(null)
        return
      }
      const v = data as VersionDetail
      setDetail(v)
      setIdentityJson(
        v.identityPack != null ? JSON.stringify(v.identityPack, null, 2) : '{}'
      )
      setPromptBp(v.promptBlueprint ?? '')
      setNegBp(v.negativePromptBlueprint ?? '')
      setNotes(v.notes ?? '')
    } catch {
      setError('Erro de rede')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [influencer.id])

  useEffect(() => {
    if (selectedId) void loadVersion(selectedId)
  }, [selectedId, loadVersion])

  useEffect(() => {
    fetch(`/api/media?tenantId=${encodeURIComponent(influencer.tenantId)}&take=60`)
      .then((r) => r.json())
      .then((d) => setMediaAssets((d.assets ?? []) as typeof mediaAssets))
      .catch(() => {})
  }, [influencer.tenantId])

  async function savePatch() {
    if (!selectedId || !detail || detail.status === 'LOCKED') return
    let identityPack: unknown = undefined
    if (identityJson.trim()) {
      try {
        identityPack = JSON.parse(identityJson) as unknown
      } catch {
        setError('Identity pack: JSON inválido')
        return
      }
    }
    setBusy('save')
    setError(null)
    try {
      const res = await fetch(`/api/influencers/${influencer.id}/versions/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityPack,
          promptBlueprint: promptBp || null,
          negativePromptBlueprint: negBp || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao guardar')
        return
      }
      await loadVersion(selectedId)
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function postGenerate(jobType: 'INFLUENCER_IDENTITY_PACK' | 'INFLUENCER_PREVIEW') {
    if (!selectedId) return
    setBusy(`gen-${jobType}`)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch(
        `/api/influencers/${influencer.id}/versions/${selectedId}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobType }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : 'Falha ao enfileirar geração'
        )
        return
      }
      setInfo(`Geração enfileirada (job: ${data.generationJobId ?? data.bullJobId ?? 'ok'}).`)
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function postApprove() {
    if (!selectedId) return
    setBusy('approve')
    setError(null)
    try {
      const res = await fetch(
        `/api/influencers/${influencer.id}/versions/${selectedId}/approve`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha')
        return
      }
      await loadVersion(selectedId)
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function postLock() {
    if (!selectedId || !canLock) return
    setBusy('lock')
    setError(null)
    try {
      const res = await fetch(
        `/api/influencers/${influencer.id}/versions/${selectedId}/lock`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha')
        return
      }
      await loadVersion(selectedId)
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function addReference() {
    if (!selectedId || !newRefAssetId.trim()) return
    setBusy('ref-add')
    setError(null)
    try {
      const res = await fetch(
        `/api/influencers/${influencer.id}/versions/${selectedId}/references`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaAssetId: newRefAssetId.trim(),
            role: newRefRole,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao adicionar')
        return
      }
      setNewRefAssetId('')
      await loadVersion(selectedId)
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  async function removeReference(refId: string) {
    if (!selectedId) return
    if (!confirm('Remover esta referência?')) return
    setBusy(`ref-del-${refId}`)
    setError(null)
    try {
      const res = await fetch(
        `/api/influencers/${influencer.id}/versions/${selectedId}/references/${refId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(typeof data.error === 'string' ? data.error : 'Falha ao remover')
        return
      }
      await loadVersion(selectedId)
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(null)
    }
  }

  const locked = detail?.status === 'LOCKED'

  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/dashboard/influencers"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Influenciadores
      </Link>

      <header>
        <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-violet-500" />
          {influencer.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {influencer.slug ? `/${influencer.slug}` : 'Sem slug'} · {influencer.status}
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">
          Versão
        </label>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="flex-1 rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          {versionSummaries.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version} — {v.status}
              {v.id === influencer.currentVersionId ? ' (atual)' : ''}
            </option>
          ))}
        </select>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {info ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
          {info}
        </p>
      ) : null}

      {!selectedId ? (
        <p className="text-gray-500">Sem versões.</p>
      ) : !detail && !loading ? (
        <p className="text-gray-500">Não foi possível carregar a versão.</p>
      ) : detail ? (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase font-semibold text-gray-500 flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              v{detail.version} · {detail.status}
            </span>
            {locked ? (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Bloqueada
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!busy || locked}
              onClick={() => void postGenerate('INFLUENCER_IDENTITY_PACK')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
            >
              {busy === 'gen-INFLUENCER_IDENTITY_PACK' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar identity pack
            </button>
            <button
              type="button"
              disabled={!!busy || locked}
              onClick={() => void postGenerate('INFLUENCER_PREVIEW')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/50 text-violet-700 dark:text-violet-300 text-sm disabled:opacity-50"
            >
              {busy === 'gen-INFLUENCER_PREVIEW' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Preview
            </button>
            <button
              type="button"
              disabled={!!busy || locked || detail.status === 'APPROVED'}
              onClick={() => void postApprove()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
            >
              {busy === 'approve' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Aprovar
            </button>
            <button
              type="button"
              disabled={!!busy || !canLock || detail.status !== 'APPROVED'}
              onClick={() => void postLock()}
              title={
                !canLock
                  ? 'Apenas administradores podem bloquear.'
                  : 'Bloquear versão (LOCKED)'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm disabled:opacity-50"
            >
              {busy === 'lock' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Lock
            </button>
            {!canLock ? (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Lock: admin
              </span>
            ) : null}
          </div>

          <section className="rounded-xl border border-gray-200/80 dark:border-white/10 p-4 space-y-4 bg-white/60 dark:bg-zinc-950/60">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Editar versão
            </h2>
            <div>
              <label className="block text-xs font-medium mb-1">Identity pack (JSON)</label>
              <textarea
                value={identityJson}
                onChange={(e) => setIdentityJson(e.target.value)}
                disabled={locked}
                rows={8}
                className="w-full font-mono text-xs rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Prompt blueprint</label>
              <textarea
                value={promptBp}
                onChange={(e) => setPromptBp(e.target.value)}
                disabled={locked}
                rows={4}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Negative prompt</label>
              <textarea
                value={negBp}
                onChange={(e) => setNegBp(e.target.value)}
                disabled={locked}
                rows={3}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={locked}
                rows={2}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              disabled={!!busy || locked}
              onClick={() => void savePatch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm disabled:opacity-50"
            >
              {busy === 'save' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar alterações
            </button>
          </section>

          <section className="rounded-xl border border-gray-200/80 dark:border-white/10 p-4 space-y-4 bg-white/60 dark:bg-zinc-950/60">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Referências (MediaAsset)
            </h2>
            {!locked ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Mídia</label>
                  <select
                    value={newRefAssetId}
                    onChange={(e) => setNewRefAssetId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    <option value="">— Escolher ficheiro —</option>
                    {mediaAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fileName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-40">
                  <label className="block text-xs font-medium mb-1">Papel</label>
                  <select
                    value={newRefRole}
                    onChange={(e) => setNewRefRole(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    {['FACE_REF', 'BODY_REF', 'STYLE_REF', 'VOICE_SAMPLE', 'OTHER'].map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!!busy || !newRefAssetId}
                  onClick={() => void addReference()}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 text-sm disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            ) : null}
            <ul className="space-y-2">
              {detail.referenceAssets?.length ? (
                detail.referenceAssets.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200/60 dark:border-white/10 px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      {r.role} · {r.mediaAsset.fileName}
                    </span>
                    {!locked ? (
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void removeReference(r.id)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-500/10"
                        aria-label="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">Nenhuma referência.</li>
              )}
            </ul>
            <p className="text-xs text-gray-500">
              Biblioteca:{' '}
              <Link href="/dashboard/media" className="text-violet-600 hover:underline">
                Mídia
              </Link>
            </p>
          </section>
        </div>
      ) : null}
    </div>
  )
}

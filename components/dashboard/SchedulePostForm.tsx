'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Loader2 } from 'lucide-react'
type AccountRow = {
  id: string
  platform: string
  platformUsername: string | null
  platformPageId: string | null
}

function defaultScheduleIso(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SchedulePostForm(props: {
  tenantId: string
  /** IDs sugeridos (ex.: export final, último vídeo com legendas) */
  suggestedMediaAssetIds: string[]
  title?: string
}) {
  const { tenantId, suggestedMediaAssetIds, title: defaultTitle } = props
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [accountId, setAccountId] = useState('')
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleIso)
  const [title, setTitle] = useState(defaultTitle ?? '')
  const [caption, setCaption] = useState('')
  const [pickedMedia, setPickedMedia] = useState<string[]>(() =>
    suggestedMediaAssetIds.filter(Boolean).slice(0, 1)
  )
  const [extraMediaId, setExtraMediaId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    void (async () => {
      const r = await fetch(
        `/api/integrations/social-accounts?tenantId=${encodeURIComponent(tenantId)}`
      )
      const d = await r.json()
      if (r.ok && Array.isArray(d.accounts)) {
        setAccounts(d.accounts)
        setAccountId((cur) => cur || d.accounts[0]?.id || '')
      }
    })()
  }, [tenantId])

  useEffect(() => {
    setPickedMedia(suggestedMediaAssetIds.filter(Boolean).slice(0, 1))
  }, [suggestedMediaAssetIds])

  const selected = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId]
  )

  const mediaAssetIds = useMemo(() => {
    const extra = extraMediaId.trim()
    const base = pickedMedia.filter(Boolean)
    if (extra && !base.includes(extra)) return [...base, extra]
    return base
  }, [pickedMedia, extraMediaId])

  async function submit() {
    if (!tenantId || !accountId || !selected) {
      setErr('Escolhe uma conta social.')
      return
    }
    const when = new Date(scheduledAt)
    if (Number.isNaN(when.getTime())) {
      setErr('Data inválida.')
      return
    }
    if (mediaAssetIds.length === 0) {
      setErr('Seleciona ou indica pelo menos um MediaAsset (vídeo/imagem na biblioteca).')
      return
    }

    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/integrations/posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          socialAccountId: accountId,
          platform: selected.platform,
          contentType: 'video',
          title: title.trim() || null,
          caption: caption.trim() || null,
          hashtags: [],
          mentions: [],
          scheduledAt: when.toISOString(),
          mediaAssetIds,
          config: {},
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Falha ao agendar')
        return
      }
      setMsg(`Agendado (post ${data.post?.id ?? ''}). O worker publica na data hora definida.`)
      setCaption('')
    } catch {
      setErr('Erro de rede')
    } finally {
      setBusy(false)
    }
  }

  if (!tenantId) return null

  return (
    <div className="rounded-xl border border-gray-200/80 dark:border-white/10 p-4 space-y-3 bg-white/50 dark:bg-zinc-950/50">
      <h3 className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-violet-500" />
        Agendar publicação
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Cria um{' '}
        <code className="bg-black/5 dark:bg-white/10 px-1 rounded text-[10px]">ScheduledPost</code>{' '}
        e fila BullMQ. Liga uma conta em{' '}
        <Link href="/dashboard/integrations" className="text-violet-600 dark:text-violet-400 underline">
          Integrações
        </Link>
        .
      </p>

      {err ? <p className="text-xs text-red-600 dark:text-red-400">{err}</p> : null}
      {msg ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded-lg px-2 py-1.5">
          {msg}{' '}
          <Link href="/dashboard/calendar" className="underline font-medium">
            Ver calendário
          </Link>
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">
            Conta
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          >
            {accounts.length === 0 ? (
              <option value="">Nenhuma conta ligada</option>
            ) : (
              accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.platform}
                  {a.platformUsername ? ` · ${a.platformUsername}` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">
            Data e hora
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">
            Título (opcional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">
            Legenda
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
        </div>

        {suggestedMediaAssetIds.filter(Boolean).length > 0 ? (
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">
              Mídia sugerida (export / legendas)
            </label>
            <ul className="space-y-1 text-xs">
              {suggestedMediaAssetIds.filter(Boolean).map((id) => (
                <li key={id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pickedMedia.includes(id)}
                    onChange={(e) => {
                      if (e.target.checked) setPickedMedia((p) => [...p, id])
                      else setPickedMedia((p) => p.filter((x) => x !== id))
                    }}
                    id={`media-${id}`}
                  />
                  <label htmlFor={`media-${id}`} className="font-mono truncate">
                    {id}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">
            Outro MediaAsset ID (opcional)
          </label>
          <input
            value={extraMediaId}
            onChange={(e) => setExtraMediaId(e.target.value)}
            placeholder="cuid…"
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={busy || accounts.length === 0}
        onClick={() => void submit()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Agendar
      </button>
    </div>
  )
}

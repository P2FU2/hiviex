'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SchedulePostForm } from '@/components/dashboard/SchedulePostForm'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Building2,
  Instagram,
  Youtube,
  Facebook,
  Music2,
  GitBranch,
} from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Tenant = { id: string; name: string; slug: string }

type ScheduledPostRow = {
  id: string
  platform: string
  contentType: string
  title: string | null
  caption: string | null
  hashtags: string[]
  scheduledAt: string
  publishedAt: string | null
  status: string
  platformPostUrl: string | null
  errorMessage: string | null
  account: { platform: string; username: string | null } | null
}

type FlowExecutionRow = {
  id: string
  flowId: string
  flowName: string
  status: string
  executionStatus: string
  error: string | null
  startedAt: string
  completedAt: string | null
}

const platformIcon = (p: string) => {
  switch (p) {
    case 'INSTAGRAM':
      return Instagram
    case 'YOUTUBE':
      return Youtube
    case 'FACEBOOK':
      return Facebook
    case 'TIKTOK':
      return Music2
    default:
      return CalendarDays
  }
}

const flowExecutionStatusStyle = (s: string) => {
  switch (s) {
    case 'completed':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
    case 'failed':
      return 'text-red-600 dark:text-red-400 bg-red-500/10'
    case 'running':
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
    case 'queued':
      return 'text-violet-600 dark:text-violet-400 bg-violet-500/10'
    case 'cancelled':
      return 'text-gray-500 bg-gray-500/10'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-500/10'
  }
}

const statusStyle = (s: string) => {
  switch (s) {
    case 'PUBLISHED':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
    case 'FAILED':
      return 'text-red-600 dark:text-red-400 bg-red-500/10'
    case 'SCHEDULED':
    case 'DRAFT':
      return 'text-violet-600 dark:text-violet-400 bg-violet-500/10'
    case 'PUBLISHING':
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
    case 'CANCELLED':
      return 'text-gray-500 bg-gray-500/10'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-500/10'
  }
}

function EditorialCalendarInner() {
  const searchParams = useSearchParams()
  const urlTenantId = searchParams.get('tenantId') || ''
  const urlMediaAssetId = searchParams.get('mediaAssetId') || ''

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [workspaceId, setWorkspaceId] = useState('')
  const [cursor, setCursor] = useState(() => new Date())
  const [posts, setPosts] = useState<ScheduledPostRow[]>([])
  const [flowExecutions, setFlowExecutions] = useState<FlowExecutionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.tenants || []).map(
          (m: { tenant: Tenant }) => m.tenant
        ) as Tenant[]
        setTenants(list)
        const fromUrl = urlTenantId && list.some((t) => t.id === urlTenantId)
        if (fromUrl) {
          setWorkspaceId(urlTenantId)
        } else if (list[0]?.id) {
          setWorkspaceId(list[0].id)
        }
      })
      .catch(() => {})
  }, [urlTenantId])

  const range = useMemo(() => {
    const monthStart = startOfMonth(cursor)
    const monthEnd = endOfMonth(cursor)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return { monthStart, monthEnd, gridStart, gridEnd }
  }, [cursor])

  const loadPosts = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const from = range.monthStart.toISOString()
      const to = range.monthEnd.toISOString()
      const [postsRes, flowsRes] = await Promise.all([
        fetch(
          `/api/integrations/posts?tenantId=${encodeURIComponent(workspaceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        ),
        fetch(
          `/api/flows/executions?tenantId=${encodeURIComponent(workspaceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        ),
      ])
      const postsData = await postsRes.json()
      const flowsData = await flowsRes.json()
      if (Array.isArray(postsData.posts)) setPosts(postsData.posts)
      else setPosts([])
      if (Array.isArray(flowsData.executions)) setFlowExecutions(flowsData.executions)
      else setFlowExecutions([])
    } catch {
      setPosts([])
      setFlowExecutions([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, range.monthStart, range.monthEnd])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const postsByDay = useMemo(() => {
    const m = new Map<string, ScheduledPostRow[]>()
    for (const p of posts) {
      const key = format(new Date(p.scheduledAt), 'yyyy-MM-dd')
      const arr = m.get(key) || []
      arr.push(p)
      m.set(key, arr)
    }
    return m
  }, [posts])

  const executionsByDay = useMemo(() => {
    const m = new Map<string, FlowExecutionRow[]>()
    for (const ex of flowExecutions) {
      const key = format(new Date(ex.startedAt), 'yyyy-MM-dd')
      const arr = m.get(key) || []
      arr.push(ex)
      m.set(key, arr)
    }
    return m
  }, [flowExecutions])

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: range.gridStart,
        end: range.gridEnd,
      }),
    [range.gridStart, range.gridEnd]
  )

  const selectedPosts = selectedDay
    ? postsByDay.get(format(selectedDay, 'yyyy-MM-dd')) || []
    : []

  const selectedFlowExecutions = selectedDay
    ? executionsByDay.get(format(selectedDay, 'yyyy-MM-dd')) || []
    : []

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Conteúdo
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl">
            <CalendarDays className="h-8 w-8 text-[var(--accent)]" strokeWidth={1.5} />
            Calendário editorial
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Publicações agendadas por workspace. Dados de{' '}
            <code className="rounded border border-[var(--border-subtle)] bg-[var(--surface-base)] px-1.5 py-0.5 text-xs font-mono text-[var(--text-secondary)]">
              ScheduledPost
            </code>{' '}
            com isolamento por tenant.
          </p>
        </div>
        <Link
          href="/dashboard/integrations"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline-offset-4 transition-premium hover:underline"
        >
          Integrações sociais
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/90 px-3 py-2.5 backdrop-blur-sm">
          <Building2 className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" strokeWidth={1.75} />
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="min-w-[200px] bg-transparent text-sm text-[var(--text-primary)] outline-none"
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

        <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/90 p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="rounded-lg p-2 text-[var(--text-secondary)] transition-premium hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)]"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <span className="min-w-[140px] px-3 text-center text-sm font-medium capitalize text-[var(--text-primary)]">
            {format(cursor, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="rounded-lg p-2 text-[var(--text-secondary)] transition-premium hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)]"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70 backdrop-blur-sm">
          <div className="grid grid-cols-7 gap-px bg-[var(--border-subtle)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <div
                key={d}
                className="bg-[var(--surface-elevated)] px-2 py-2 text-center"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-[var(--border-subtle)]">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayPosts = postsByDay.get(key) || []
              const dayFlows = executionsByDay.get(key) || []
              const inMonth = isSameMonth(day, cursor)
              const isSel = selectedDay && isSameDay(day, selectedDay)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={[
                    'min-h-[88px] bg-[var(--surface-base)] p-2 text-left transition-premium',
                    inMonth ? '' : 'opacity-40',
                    isSel
                      ? 'ring-2 ring-inset ring-[var(--accent)]'
                      : 'hover:bg-[var(--accent-muted)]',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'text-sm font-medium',
                      isSameDay(day, new Date())
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-primary)]',
                    ].join(' ')}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayPosts.slice(0, 3).map((p) => {
                      const Icon = platformIcon(p.platform)
                      return (
                        <span
                          key={p.id}
                          className="inline-flex rounded-md bg-[var(--surface-elevated)] p-0.5 ring-1 ring-[var(--border-subtle)]"
                          title={`${p.platform} · ${p.status}`}
                        >
                          <Icon className="h-3 w-3" />
                        </span>
                      )
                    })}
                    {dayPosts.length > 3 ? (
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        +{dayPosts.length - 3}
                      </span>
                    ) : null}
                    {dayFlows.length > 0 ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[var(--accent)]"
                        title={`${dayFlows.length} execução(ões) de fluxo`}
                      >
                        <GitBranch className="h-3 w-3" strokeWidth={1.75} />
                        {dayFlows.length}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
          {loading ? (
            <p className="border-t border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-tertiary)]">
              A carregar…
            </p>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 p-4 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Clock className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
              {selectedDay
                ? format(selectedDay, "d 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'}
            </h2>
            {!selectedDay ? (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Clique num dia na grelha para ver publicações e execuções de fluxos.
              </p>
            ) : selectedPosts.length === 0 && selectedFlowExecutions.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Nada neste dia (sem posts nem fluxos).
              </p>
            ) : (
              <div className="mt-3 space-y-6">
                {selectedPosts.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Publicações
                    </h3>
                    <ul className="mt-2 space-y-3">
                      {selectedPosts.map((p) => {
                        const Icon = platformIcon(p.platform)
                        return (
                          <li
                            key={p.id}
                            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/50 p-3 text-sm"
                          >
                            <div className="flex items-start gap-2">
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-[var(--text-primary)]">
                                  {p.title || p.caption?.slice(0, 80) || 'Sem título'}
                                </p>
                                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                                  {format(new Date(p.scheduledAt), 'HH:mm')} ·{' '}
                                  {p.account?.username || p.platform}
                                </p>
                                <span
                                  className={`inline-block mt-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${statusStyle(p.status)}`}
                                >
                                  {p.status}
                                </span>
                                {p.platformPostUrl ? (
                                  <a
                                    href={p.platformPostUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                                  >
                                    Ver na rede
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : null}
                                {p.errorMessage ? (
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 break-words">
                                    {p.errorMessage}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}

                {selectedFlowExecutions.length > 0 ? (
                  <div>
                    <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      <GitBranch className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Fluxos
                    </h3>
                    <ul className="mt-2 space-y-3">
                      {selectedFlowExecutions.map((ex) => (
                        <li
                          key={ex.id}
                          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/50 p-3 text-sm"
                        >
                          <p className="truncate font-medium text-[var(--text-primary)]">
                            {ex.flowName}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                            {format(new Date(ex.startedAt), 'HH:mm:ss')}
                            {ex.completedAt
                              ? ` – ${format(new Date(ex.completedAt), 'HH:mm:ss')}`
                              : ''}
                          </p>
                          <span
                            className={`inline-block mt-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${flowExecutionStatusStyle(ex.executionStatus)}`}
                          >
                            {ex.executionStatus}
                          </span>
                          {ex.error ? (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 break-words">
                              {ex.error}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-4 text-xs text-[var(--text-secondary)]">
            Para agendar via API, use{' '}
            <code className="rounded border border-[var(--border-subtle)] bg-[var(--surface-base)] px-1.5 py-0.5 font-mono text-[11px]">
              POST /api/integrations/posts/schedule
            </code>
            .
          </div>

          {workspaceId ? (
            <SchedulePostForm
              tenantId={workspaceId}
              suggestedMediaAssetIds={
                urlMediaAssetId ? [urlMediaAssetId] : []
              }
            />
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export default function EditorialCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-[var(--border-subtle)]" />
          <div className="h-96 animate-pulse rounded-xl bg-[var(--border-subtle)]" />
        </div>
      }
    >
      <EditorialCalendarInner />
    </Suspense>
  )
}

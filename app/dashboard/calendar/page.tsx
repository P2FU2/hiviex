'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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

export default function EditorialCalendarPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [workspaceId, setWorkspaceId] = useState('')
  const [cursor, setCursor] = useState(() => new Date())
  const [posts, setPosts] = useState<ScheduledPostRow[]>([])
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
        if (list[0]?.id) setWorkspaceId(list[0].id)
      })
      .catch(() => {})
  }, [])

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
      const r = await fetch(
        `/api/integrations/posts?tenantId=${encodeURIComponent(workspaceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      const data = await r.json()
      if (Array.isArray(data.posts)) setPosts(data.posts)
      else setPosts([])
    } catch {
      setPosts([])
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

  return (
    <div className="dashboard-app min-h-screen p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Conteúdo
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-black dark:text-white flex items-center gap-2 mt-1">
            <CalendarDays className="w-8 h-8 text-violet-500" />
            Calendário editorial
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-xl">
            Visualize publicações agendadas por workspace. Os dados vêm de{' '}
            <code className="text-xs bg-black/5 dark:bg-white/10 px-1 rounded">
              ScheduledPost
            </code>{' '}
            e respeitam o isolamento por tenant.
          </p>
        </div>
        <Link
          href="/dashboard/integrations"
          className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
        >
          Integrações sociais
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
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

        <div className="flex items-center gap-1 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 p-1">
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-3 text-sm font-medium min-w-[140px] text-center capitalize">
            {format(cursor, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-zinc-950/60 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200/60 dark:bg-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="bg-white dark:bg-zinc-950 px-2 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200/60 dark:bg-white/10">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayPosts = postsByDay.get(key) || []
              const inMonth = isSameMonth(day, cursor)
              const isSel = selectedDay && isSameDay(day, selectedDay)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={[
                    'min-h-[88px] p-2 text-left transition-colors bg-white dark:bg-zinc-950',
                    inMonth ? '' : 'opacity-40',
                    isSel
                      ? 'ring-2 ring-inset ring-violet-500'
                      : 'hover:bg-violet-500/5',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'text-sm font-medium',
                      isSameDay(day, new Date())
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-black dark:text-white',
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
                          className="inline-flex rounded-md bg-black/5 dark:bg-white/10 p-0.5"
                          title={`${p.platform} · ${p.status}`}
                        >
                          <Icon className="w-3 h-3" />
                        </span>
                      )
                    })}
                    {dayPosts.length > 3 ? (
                      <span className="text-[10px] text-gray-500">
                        +{dayPosts.length - 3}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
          {loading ? (
            <p className="text-xs text-gray-500 px-4 py-2 border-t border-gray-200/60 dark:border-white/10">
              A carregar…
            </p>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-zinc-950/60 p-4">
            <h2 className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              {selectedDay
                ? format(selectedDay, "d 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'}
            </h2>
            {!selectedDay ? (
              <p className="text-sm text-gray-500 mt-3">
                Clique num dia na grelha para ver os posts agendados.
              </p>
            ) : selectedPosts.length === 0 ? (
              <p className="text-sm text-gray-500 mt-3">
                Nenhuma publicação neste dia.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {selectedPosts.map((p) => {
                  const Icon = platformIcon(p.platform)
                  return (
                    <li
                      key={p.id}
                      className="rounded-xl border border-gray-200/60 dark:border-white/10 p-3 text-sm"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-gray-600 dark:text-gray-300" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-black dark:text-white truncate">
                            {p.title || p.caption?.slice(0, 80) || 'Sem título'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
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
                              className="mt-2 inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400"
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
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 p-4 text-xs text-gray-500">
            Para agendar via API, use{' '}
            <code className="bg-black/5 dark:bg-white/10 px-1 rounded">
              POST /api/integrations/posts/schedule
            </code>
            .
          </div>
        </aside>
      </div>
    </div>
  )
}

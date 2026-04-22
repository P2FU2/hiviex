'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clapperboard, ArrowLeft } from 'lucide-react'

type Tenant = { id: string; name: string }

export default function NewVideoProjectPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.tenants || []).map(
          (m: { tenant: Tenant }) => m.tenant
        ) as Tenant[]
        setTenants(list)
        if (list[0]?.id) setTenantId(list[0].id)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!tenantId || !title.trim()) {
      setError('Workspace e título são obrigatórios.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/video/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, title: title.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Falha ao criar projeto')
        return
      }
      router.push('/dashboard/video')
    } catch {
      setError('Erro de rede.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link
        href="/dashboard/video"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Vídeo
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
          <Clapperboard className="w-7 h-7 text-violet-500" />
          Novo projeto de vídeo
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Cria o projeto e a sessão de edição vazia. Ingestão por URL e análise serão ligadas aos
          workers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Workspace</label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            placeholder="Campanha Q2 — cortes YouTube"
            maxLength={200}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium disabled:opacity-50"
        >
          {loading ? 'A criar…' : 'Criar projeto'}
        </button>
      </form>
    </div>
  )
}

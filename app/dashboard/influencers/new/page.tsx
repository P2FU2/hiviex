'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft } from 'lucide-react'

type Tenant = { id: string; name: string }

export default function NewInfluencerPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
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
    if (!tenantId || !name.trim()) {
      setError('Workspace e nome são obrigatórios.')
      return
    }
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        tenantId,
        name: name.trim(),
      }
      if (slug.trim()) body.slug = slug.trim().toLowerCase()

      const res = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          typeof data.error === 'string' ? data.error : 'Falha ao criar influenciador'
        )
        return
      }
      router.push(`/dashboard/influencers/${data.id}`)
    } catch {
      setError('Erro de rede.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link
        href="/dashboard/influencers"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-violet-500" />
          Novo influenciador
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Será criada a <strong>versão 1</strong> em rascunho. Depois podes editar identity pack,
          blueprints e referências (API e UI vão sendo estendidos).
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
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            placeholder="Ex.: Lia — Tech Portugal"
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (opcional)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            placeholder="lia-tech (a-z, 0-9, hífen)"
            maxLength={80}
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
          {loading ? 'A criar…' : 'Criar influenciador'}
        </button>
      </form>
    </div>
  )
}

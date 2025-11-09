/**
 * New Workflow Page
 * 
 * Criar novo workflow
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewWorkflowPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Por favor, insira um nome para o workflow')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create workflow')

      const workflow = await response.json()
      router.push(`/dashboard/workflows/${workflow.id}`)
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Erro ao criar workflow')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/workflows"
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
        </Link>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Novo Workflow
        </h1>
      </div>

      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              placeholder="Nome do workflow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
              placeholder="Descrição do workflow"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/workflows"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Criando...' : 'Criar Workflow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


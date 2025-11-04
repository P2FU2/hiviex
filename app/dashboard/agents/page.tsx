/**
 * Agents List Page
 * 
 * Placeholder for agents list (to be implemented)
 */

import { getAuthSession } from '@/lib/auth/session'
import Link from 'next/link'
import { Plus, Bot } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  const session = await getAuthSession()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Agents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your AI agents
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Agent
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Agents feature coming soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This section will allow you to create and manage AI agents
        </p>
      </div>
    </div>
  )
}


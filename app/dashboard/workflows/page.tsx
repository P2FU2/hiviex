/**
 * Workflows Page
 * 
 * Placeholder for workflows (to be implemented)
 */

import { getAuthSession } from '@/lib/auth/session'
import { Workflow } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  const session = await getAuthSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Workflows
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Automate your processes
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <Workflow className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Workflows feature coming soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Workflow automation will be available here
        </p>
      </div>
    </div>
  )
}


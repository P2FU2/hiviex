/**
 * User Settings Page
 * 
 * User account settings
 */

import { getAuthSession } from '@/lib/auth/session'
import { Settings } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getAuthSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Settings page coming soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Account settings will be available here
        </p>
      </div>
    </div>
  )
}


/**
 * Workspaces List Page
 * 
 * Displays all workspaces the user has access to
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import Link from 'next/link'
import { Plus, Settings, Users as UsersIcon } from 'lucide-react'

export default async function WorkspacesPage() {
  const session = await getAuthSession()
  // getAuthSession guarantees session.user.id exists

  const tenantMemberships = await getUserTenants(session.user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workspaces
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your workspaces and organizations
          </p>
        </div>
        <Link
          href="/dashboard/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Workspace
        </Link>
      </div>

      {/* Workspaces List */}
      {tenantMemberships.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No workspaces yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first workspace to get started
          </p>
          <Link
            href="/dashboard/workspaces/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenantMemberships.map((membership: any) => (
            <div
              key={membership.tenant.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {membership.tenant.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {membership.tenant.slug}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                  {membership.role}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Link
                  href={`/dashboard/workspaces/${membership.tenant.id}`}
                  className="flex-1 px-4 py-2 text-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Open
                </Link>
                {(membership.role === 'OWNER' || membership.role === 'ADMIN') && (
                  <Link
                    href={`/dashboard/workspaces/${membership.tenant.id}/settings`}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


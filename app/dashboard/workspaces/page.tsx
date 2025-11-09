/**
 * Workspaces List Page
 * 
 * Displays all workspaces the user has access to
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import Link from 'next/link'
import { Plus, Settings, Users as UsersIcon } from 'lucide-react'
import DeleteWorkspaceButton from '@/components/DeleteWorkspaceButton'

export const dynamic = 'force-dynamic'

export default async function WorkspacesPage() {
  const session = await getAuthSession()
  // getAuthSession guarantees session.user.id exists

  const tenantMemberships = await getUserTenants(session.user.id)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Workspaces
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gerencie seus workspaces e organizações
          </p>
        </div>
        <Link
          href="/dashboard/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Novo Workspace
        </Link>
      </div>

      {/* Workspaces List */}
      {tenantMemberships.length === 0 ? (
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-12 text-center">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            Nenhum workspace ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crie seu primeiro workspace para começar
          </p>
          <Link
            href="/dashboard/workspaces/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Criar Workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
          {tenantMemberships.map((membership: any) => (
            <div
              key={membership.tenant.id}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                    <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-black dark:text-white text-lg truncate">
                      {membership.tenant.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {membership.tenant.slug}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded flex-shrink-0 ml-2">
                  {membership.role}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200/50 dark:border-white/10">
                <Link
                  href={`/dashboard/workspaces/${membership.tenant.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white"
                >
                  Abrir
                </Link>
                {(membership.role === 'OWNER' || membership.role === 'ADMIN') && (
                  <>
                    <Link
                      href={`/dashboard/workspaces/${membership.tenant.id}/settings`}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                      title="Configurações"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    {membership.role === 'OWNER' && (
                      <DeleteWorkspaceButton workspaceId={membership.tenant.id} workspaceName={membership.tenant.name} />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


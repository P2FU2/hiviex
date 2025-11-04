/**
 * Workspace Settings Page
 * 
 * Settings page for workspace (only accessible by Owner/Admin)
 */

import { getAuthSession } from '@/lib/auth/session'
import { getTenantWithUser, hasTenantPermission } from '@/lib/utils/tenant'
import { TenantRole } from '@prisma/client'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getAuthSession()

  const membership = await getTenantWithUser(params.id, session.user.id)

  if (!membership) {
    notFound()
  }

  // Check if user is Owner or Admin
  const isAdmin = membership.role === 'OWNER' || membership.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect(`/dashboard/workspaces/${params.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/workspaces/${params.id}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Workspace
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Workspace Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {membership.tenant.name}
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          General Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Settings page coming soon...
        </p>
      </div>
    </div>
  )
}


/**
 * Workspace Settings Page
 * 
 * Settings page for workspace with specific features (only accessible by Owner/Admin)
 */

import { getAuthSession } from '@/lib/auth/session'
import { getTenantWithUser, hasTenantPermission } from '@/lib/utils/tenant'
import type { TenantRole } from '@/lib/types/domain'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Users, Shield, Bell, Key, Trash2, Settings as SettingsIcon } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import WorkspaceSettingsForm from '@/components/workspaces/WorkspaceSettingsForm'
import MembersManagement from '@/components/workspaces/MembersManagement'
import PermissionsSection from '@/components/workspaces/PermissionsSection'
import NotificationsSection from '@/components/workspaces/NotificationsSection'
import WorkspaceApiKeysSection from '@/components/workspaces/WorkspaceApiKeysSection'
import DangerZone from '@/components/workspaces/DangerZone'

export const dynamic = 'force-dynamic'

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getAuthSession()

  // Handle Next.js 15 params format
  const resolvedParams = await Promise.resolve(params)
  const workspaceId = resolvedParams.id

  const membership = await getTenantWithUser(workspaceId, session.user.id)

  if (!membership) {
    notFound()
  }

  // Check if user is Owner or Admin
  const isAdmin = membership.role === 'OWNER' || membership.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect(`/dashboard/workspaces/${workspaceId}`)
  }

  // Get workspace stats
  const [agentsCount, membersCount, workflowsCount] = await Promise.all([
    prisma.agent.count({ where: { tenantId: workspaceId } }),
    (prisma as any).tenantUser.count({ where: { tenantId: workspaceId } }),
    prisma.workflow.count({ where: { tenantId: workspaceId } }),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/workspaces/${workspaceId}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao Workspace</span>
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Configurações do Workspace
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {membership.tenant.name}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Membros</p>
              <p className="text-2xl font-bold text-black dark:text-white">{membersCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agentes</p>
              <p className="text-2xl font-bold text-black dark:text-white">{agentsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Workflows</p>
              <p className="text-2xl font-bold text-black dark:text-white">{workflowsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Configurações Gerais
          </h2>
          <WorkspaceSettingsForm workspaceId={workspaceId} workspace={membership.tenant} />
        </div>

        {/* Members Management */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Membros
          </h2>
          <MembersManagement 
            workspaceId={workspaceId} 
            userRole={membership.role}
            initialMembers={await getMembers(workspaceId)}
          />
        </div>

        {/* Permissions */}
        {membership.role === 'OWNER' && (
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissões e Segurança
            </h2>
            <PermissionsSection workspaceId={workspaceId} />
          </div>
        )}

        {/* Notifications */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </h2>
          <NotificationsSection workspaceId={workspaceId} />
        </div>

        {/* API Keys */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-6 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Chaves API do Workspace
          </h2>
          <WorkspaceApiKeysSection workspaceId={workspaceId} userRole={membership.role} />
        </div>

        {/* Danger Zone */}
        {membership.role === 'OWNER' && (
          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Zona de Perigo
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Ações irreversíveis. Tenha cuidado.
            </p>
            <DangerZone workspaceId={workspaceId} workspaceName={membership.tenant.name} />
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get members
async function getMembers(workspaceId: string) {
  const members = await (prisma as any).tenantUser.findMany({
    where: { tenantId: workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { role: 'asc' },
  })
  return members
}

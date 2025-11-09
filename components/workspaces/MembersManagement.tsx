/**
 * Members Management Component
 * 
 * Manage workspace members with invite and role editing
 */

'use client'

import { useState } from 'react'
import { Users, UserPlus, Edit, Trash2, Loader2, X } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface MembersManagementProps {
  workspaceId: string
  userRole: string
  initialMembers: Member[]
}

export default function MembersManagement({
  workspaceId,
  userRole,
  initialMembers,
}: MembersManagementProps) {
  const [members, setMembers] = useState(initialMembers)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to invite member')
      }

      const newMember = await response.json()
      setMembers([...members, newMember])
      setShowInviteModal(false)
      setInviteEmail('')
      
      showNotification('Membro convidado com sucesso!', 'success')
    } catch (error) {
      console.error('Error inviting member:', error)
      showNotification(error instanceof Error ? error.message : 'Erro ao convidar membro', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      setMembers(members.filter(m => m.id !== memberId))
      showNotification('Membro removido com sucesso!', 'success')
    } catch (error) {
      console.error('Error removing member:', error)
      showNotification(error instanceof Error ? error.message : 'Erro ao remover membro', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  const canEdit = (memberRole: string) => {
    if (userRole === 'OWNER') return memberRole !== 'OWNER'
    if (userRole === 'ADMIN') return memberRole === 'MEMBER'
    return false
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gerencie os membros do workspace e suas permissões
        </p>
        {(userRole === 'OWNER' || userRole === 'ADMIN') && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Convidar Membro
          </button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border border-gray-200/50 dark:border-white/10 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                {member.user.name?.charAt(0).toUpperCase() || member.user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">
                  {member.user.name || 'Sem nome'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {member.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                {member.role}
              </span>
              {canEdit(member.role) && (
                <>
                  <Link
                    href={`/dashboard/workspaces/${workspaceId}/members/${member.id}/edit`}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    disabled={isLoading}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200/50 dark:border-white/10 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Convidar Membro
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="MEMBER">Membro</option>
                  {userRole === 'OWNER' && <option value="ADMIN">Administrador</option>}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Convidar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


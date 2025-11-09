/**
 * Delete Workspace Button Component
 */

'use client'

import { useRouter } from 'next/navigation'
import DeleteButton from './DeleteButton'

interface DeleteWorkspaceButtonProps {
  workspaceId: string
  workspaceName: string
}

export default function DeleteWorkspaceButton({
  workspaceId,
  workspaceName,
}: DeleteWorkspaceButtonProps) {
  const router = useRouter()

  const handleDelete = async () => {
    const response = await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete workspace')
    }

    router.refresh()
  }

  return (
    <DeleteButton
      onDelete={handleDelete}
      itemName={workspaceName}
      size="md"
    />
  )
}


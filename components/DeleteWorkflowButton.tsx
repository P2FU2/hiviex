/**
 * Delete Workflow Button Component
 */

'use client'

import { useRouter } from 'next/navigation'
import DeleteButton from './DeleteButton'

interface DeleteWorkflowButtonProps {
  workflowId: string
  workflowName: string
}

export default function DeleteWorkflowButton({
  workflowId,
  workflowName,
}: DeleteWorkflowButtonProps) {
  const router = useRouter()

  const handleDelete = async () => {
    const response = await fetch(`/api/workflows/${workflowId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete workflow')
    }

    router.refresh()
  }

  return (
    <DeleteButton
      onDelete={handleDelete}
      itemName={workflowName}
      size="sm"
    />
  )
}


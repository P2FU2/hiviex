/**
 * Delete Agent Button Component
 */

'use client'

import { useRouter } from 'next/navigation'
import DeleteButton from './DeleteButton'

interface DeleteAgentButtonProps {
  agentId: string
  agentName: string
}

export default function DeleteAgentButton({
  agentId,
  agentName,
}: DeleteAgentButtonProps) {
  const router = useRouter()

  const handleDelete = async () => {
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete agent')
    }

    router.refresh()
  }

  return (
    <DeleteButton
      onDelete={handleDelete}
      itemName={agentName}
      size="sm"
    />
  )
}


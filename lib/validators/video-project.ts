import { z } from 'zod'

export const patchVideoProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})

export const patchClipCandidateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
})

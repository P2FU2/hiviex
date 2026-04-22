import { z } from 'zod'

export const createVideoSourceBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('URL'),
    sourceUrl: z.string().url().max(8000),
    metadata: z.record(z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('UPLOAD'),
    mediaAssetId: z.string().cuid(),
    metadata: z.record(z.unknown()).optional(),
  }),
])

export const analyzeClipsBodySchema = z.object({
  sourceId: z.string().cuid().optional(),
})

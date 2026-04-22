import { z } from 'zod'

export const createInfluencerBodySchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  initialIdentityPack: z.record(z.unknown()).optional(),
})

export const patchInfluencerBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const newVersionBodySchema = z.object({
  copyFromVersion: z.number().int().positive().optional(),
  identityPack: z.record(z.unknown()).optional(),
  promptBlueprint: z.string().max(20000).optional(),
  negativePromptBlueprint: z.string().max(20000).optional(),
  brandPersona: z.record(z.unknown()).optional(),
})

export const patchInfluencerVersionBodySchema = z.object({
  identityPack: z.record(z.unknown()).optional(),
  promptBlueprint: z.string().max(20000).nullable().optional(),
  negativePromptBlueprint: z.string().max(20000).nullable().optional(),
  brandPersona: z.record(z.unknown()).nullable().optional(),
  platformGuidelines: z.record(z.unknown()).nullable().optional(),
  notes: z.string().max(20000).nullable().optional(),
})

export const influencerGenerateJobBodySchema = z.object({
  jobType: z.enum(['INFLUENCER_IDENTITY_PACK', 'INFLUENCER_PREVIEW']),
})

export const influencerReferenceBodySchema = z.object({
  mediaAssetId: z.string().cuid(),
  role: z
    .enum(['FACE_REF', 'BODY_REF', 'STYLE_REF', 'VOICE_SAMPLE', 'OTHER'])
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

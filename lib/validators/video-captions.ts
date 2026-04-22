import { z } from 'zod'

export const captionSegmentSchema = z.object({
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  text: z.string().min(1).max(5000),
})

export const createCaptionTrackSchema = z.object({
  locale: z.string().min(2).max(20).optional(),
  stylePreset: z.string().max(80).nullable().optional(),
  segments: z.array(captionSegmentSchema).min(1),
})

export const patchCaptionTrackSchema = z.object({
  locale: z.string().min(2).max(20).optional(),
  stylePreset: z.string().max(80).nullable().optional(),
  segments: z.array(captionSegmentSchema).min(1).optional(),
})

export const captionRenderBodySchema = z.object({
  sourceMediaAssetId: z.string().cuid(),
})

export const finalMuxBodySchema = z
  .object({
    videoMediaAssetId: z.string().cuid(),
    audioMediaAssetId: z.string().cuid().optional(),
    audioUrl: z.string().url().max(8000).optional(),
  })
  .refine((d) => !d.audioUrl || /^https:\/\//i.test(d.audioUrl), {
    message: 'audioUrl tem de ser HTTPS',
  })

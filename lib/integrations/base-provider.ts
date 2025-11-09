/**
 * Base Provider Interface
 * 
 * Interface base para todos os provedores de redes sociais
 */

import type { SocialPlatform } from '@/lib/types/domain'

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
}

export interface PublishOptions {
  title?: string
  caption?: string
  hashtags?: string[]
  mentions?: string[]
  scheduledAt?: Date
  thumbnailUrl?: string
  location?: {
    name: string
    lat?: number
    lng?: number
  }
  [key: string]: any // Para opções específicas da plataforma
}

export interface PublishResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
  metadata?: Record<string, any>
}

export interface MetricsResult {
  views?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  clicks?: number
  reach?: number
  impressions?: number
  watchTime?: number
  averageViewDuration?: number
  metadata?: Record<string, any>
}

export interface MediaUploadResult {
  success: boolean
  mediaId?: string
  mediaUrl?: string
  error?: string
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
}

export abstract class BaseSocialProvider {
  abstract platform: SocialPlatform
  abstract name: string

  /**
   * OAuth
   */
  abstract getAuthUrl(state: string, redirectUri: string): string
  abstract exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens>
  abstract refreshTokens(refreshToken: string): Promise<OAuthTokens>
  abstract revokeTokens(accessToken: string): Promise<boolean>

  /**
   * Publicação
   */
  abstract publishPost(
    tokens: OAuthTokens,
    mediaUrls: string[],
    options: PublishOptions
  ): Promise<PublishResult>

  abstract schedulePost(
    tokens: OAuthTokens,
    mediaUrls: string[],
    options: PublishOptions
  ): Promise<PublishResult>

  /**
   * Mídia
   */
  abstract uploadMedia(
    tokens: OAuthTokens,
    file: Buffer | string, // Buffer ou URL
    mediaType: 'image' | 'video',
    options?: Record<string, any>
  ): Promise<MediaUploadResult>

  /**
   * Métricas
   */
  abstract getPostMetrics(
    tokens: OAuthTokens,
    postId: string
  ): Promise<MetricsResult>

  abstract getAccountMetrics(
    tokens: OAuthTokens,
    dateRange?: { start: Date; end: Date }
  ): Promise<MetricsResult[]>

  /**
   * Webhooks
   */
  abstract subscribeWebhook(
    tokens: OAuthTokens,
    webhookUrl: string,
    events: string[]
  ): Promise<{ webhookId: string; verifyToken?: string }>

  abstract unsubscribeWebhook(
    tokens: OAuthTokens,
    webhookId: string
  ): Promise<boolean>

  /**
   * Utilitários
   */
  abstract validateTokens(tokens: OAuthTokens): Promise<boolean>
  abstract getAccountInfo(tokens: OAuthTokens): Promise<{
    userId: string
    username?: string
    name?: string
    avatar?: string
    metadata?: Record<string, any>
  }>
}


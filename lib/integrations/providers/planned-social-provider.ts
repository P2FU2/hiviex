/**
 * Provedores planeados (Facebook, TikTok, Kwai, Gmail) — OAuth redireciona para aviso;
 * publicação devolve falha controlada em vez de lançar na factory.
 */

import type { SocialPlatform } from '@/lib/types/domain'
import {
  BaseSocialProvider,
  type OAuthTokens,
  type PublishOptions,
  type PublishResult,
  type MediaUploadResult,
  type MetricsResult,
} from '../base-provider'

function userFacingName(platform: SocialPlatform): string {
  switch (platform) {
    case 'FACEBOOK':
      return 'Facebook'
    case 'TIKTOK':
      return 'TikTok'
    case 'KWAII':
      return 'Kwai'
    case 'GMAIL':
      return 'Gmail'
    default:
      return platform
  }
}

export function plannedIntegrationMessage(platform: SocialPlatform): string {
  const n = userFacingName(platform)
  return `${n}: integração em preparação. Utilize YouTube ou Instagram.`
}

export class PlannedSocialProvider extends BaseSocialProvider {
  constructor(
    public readonly platform: SocialPlatform,
    public readonly name: string
  ) {
    super()
  }

  getAuthUrl(_state: string, redirectUri: string): string {
    const origin = new URL(redirectUri).origin
    const q = new URLSearchParams({
      notice: 'planned',
      platform: this.platform,
    })
    return `${origin}/dashboard/integrations?${q.toString()}`
  }

  async exchangeCodeForTokens(): Promise<OAuthTokens> {
    throw new Error(plannedIntegrationMessage(this.platform))
  }

  async refreshTokens(): Promise<OAuthTokens> {
    throw new Error(plannedIntegrationMessage(this.platform))
  }

  async revokeTokens(): Promise<boolean> {
    return false
  }

  async publishPost(
    _tokens: OAuthTokens,
    _mediaUrls: string[],
    _options: PublishOptions
  ): Promise<PublishResult> {
    return { success: false, error: plannedIntegrationMessage(this.platform) }
  }

  async schedulePost(
    tokens: OAuthTokens,
    mediaUrls: string[],
    options: PublishOptions
  ): Promise<PublishResult> {
    return this.publishPost(tokens, mediaUrls, options)
  }

  async uploadMedia(
    _tokens: OAuthTokens,
    _file: Buffer | string,
    _mediaType: 'image' | 'video'
  ): Promise<MediaUploadResult> {
    return { success: false, error: plannedIntegrationMessage(this.platform) }
  }

  async getPostMetrics(): Promise<MetricsResult> {
    return {}
  }

  async getAccountMetrics(): Promise<MetricsResult[]> {
    return []
  }

  async subscribeWebhook(): Promise<{ webhookId: string; verifyToken?: string }> {
    throw new Error(plannedIntegrationMessage(this.platform))
  }

  async unsubscribeWebhook(): Promise<boolean> {
    return false
  }

  async validateTokens(): Promise<boolean> {
    return false
  }

  async getAccountInfo(): Promise<{
    userId: string
    username?: string
    name?: string
    avatar?: string
    pageAccessToken?: string
    metadata?: Record<string, unknown>
  }> {
    throw new Error(plannedIntegrationMessage(this.platform))
  }
}

/**
 * Instagram Provider
 * 
 * Implementação para Instagram Graph API
 * Requer: Conta Business conectada a uma Página do Facebook
 * Docs: https://developers.facebook.com/docs/instagram-api
 */

import { BaseSocialProvider, type OAuthTokens, type PublishOptions, type PublishResult, type MediaUploadResult, type MetricsResult } from '../base-provider'

export class InstagramProvider extends BaseSocialProvider {
  platform = 'INSTAGRAM' as const
  name = 'Instagram'

  private clientId: string
  private clientSecret: string
  private apiBaseUrl = 'https://graph.facebook.com/v18.0'

  constructor() {
    super()
    this.clientId = process.env.FACEBOOK_APP_ID || ''
    this.clientSecret = process.env.FACEBOOK_APP_SECRET || ''
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      state,
    })
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    // 1. Exchange code for short-lived token
    const tokenResponse = await fetch(
      `${this.apiBaseUrl}/oauth/access_token?` +
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
      { method: 'GET' }
    )

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code')
    }

    const tokenData = await tokenResponse.json()
    const shortLivedToken = tokenData.access_token

    // 2. Exchange short-lived for long-lived token
    const longLivedResponse = await fetch(
      `${this.apiBaseUrl}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        fb_exchange_token: shortLivedToken,
      }),
      { method: 'GET' }
    )

    if (!longLivedResponse.ok) {
      throw new Error('Failed to get long-lived token')
    }

    const longLivedData = await longLivedResponse.json()

    return {
      accessToken: longLivedData.access_token,
      expiresAt: longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000)
        : undefined,
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    // Instagram usa long-lived tokens que expiram em 60 dias
    // Não há refresh token, precisa re-autenticar
    throw new Error('Instagram does not support token refresh, re-authenticate required')
  }

  async revokeTokens(accessToken: string): Promise<boolean> {
    const response = await fetch(
      `${this.apiBaseUrl}/me/permissions?access_token=${accessToken}`,
      { method: 'DELETE' }
    )
    return response.ok
  }

  async publishPost(
    tokens: OAuthTokens,
    mediaUrls: string[],
    options: PublishOptions
  ): Promise<PublishResult> {
    try {
      // Instagram requer Instagram Business Account ID (da página conectada)
      const pageId = options.metadata?.pageId
      const igUserId = options.metadata?.igUserId

      if (!pageId || !igUserId) {
        throw new Error('Page ID and Instagram User ID required')
      }

      // 1. Criar container de mídia
      const mediaType = mediaUrls[0]?.includes('.mp4') ? 'REELS' : 'IMAGE'
      
      // Construir parâmetros, removendo valores undefined
      const containerParams: Record<string, string> = {
        access_token: tokens.accessToken,
        caption: this.formatCaption(options.caption, options.hashtags, options.mentions),
        media_type: mediaType,
      }
      
      if (mediaType === 'IMAGE' && mediaUrls[0]) {
        containerParams.image_url = mediaUrls[0]
      } else if (mediaType === 'REELS' && mediaUrls[0]) {
        containerParams.video_url = mediaUrls[0]
      }
      
      const containerResponse = await fetch(
        `${this.apiBaseUrl}/${igUserId}/media?` +
        new URLSearchParams(containerParams),
        { method: 'POST' }
      )

      if (!containerResponse.ok) {
        const error = await containerResponse.text()
        throw new Error(`Failed to create media container: ${error}`)
      }

      const container = await containerResponse.json()
      const creationId = container.id

      // 2. Publicar (ou agendar)
      const publishParams: Record<string, string> = {
        access_token: tokens.accessToken,
        creation_id: creationId,
      }

      if (options.scheduledAt) {
        publishParams.scheduled_publish_time = Math.floor(options.scheduledAt.getTime() / 1000).toString()
      }

      const publishResponse = await fetch(
        `${this.apiBaseUrl}/${igUserId}/media_publish?` +
        new URLSearchParams(publishParams),
        { method: 'POST' }
      )

      if (!publishResponse.ok) {
        const error = await publishResponse.text()
        throw new Error(`Failed to publish: ${error}`)
      }

      const publishData = await publishResponse.json()

      return {
        success: true,
        postId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}/`,
        metadata: {
          creationId,
          scheduled: !!options.scheduledAt,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to publish post',
      }
    }
  }

  async schedulePost(
    tokens: OAuthTokens,
    mediaUrls: string[],
    options: PublishOptions
  ): Promise<PublishResult> {
    return this.publishPost(tokens, mediaUrls, {
      ...options,
      scheduledAt: options.scheduledAt,
    })
  }

  async uploadMedia(
    tokens: OAuthTokens,
    file: Buffer | string,
    mediaType: 'image' | 'video',
    options?: Record<string, any>
  ): Promise<MediaUploadResult> {
    // Instagram requer URL pública, não upload direto
    // O arquivo deve estar no S3/CDN primeiro
    return {
      success: false,
      error: 'Instagram requires public URL, upload to S3 first',
    }
  }

  async getPostMetrics(tokens: OAuthTokens, postId: string): Promise<MetricsResult> {
    const response = await fetch(
      `${this.apiBaseUrl}/${postId}/insights?` +
      new URLSearchParams({
        access_token: tokens.accessToken,
        metric: 'impressions,reach,likes,comments,shares,saved',
      }),
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error('Failed to get post metrics')
    }

    const data = await response.json()
    const metrics: Record<string, number> = {}

    data.data?.forEach((item: any) => {
      metrics[item.name] = parseInt(item.values?.[0]?.value || '0')
    })

    return {
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      saves: metrics.saved || 0,
    }
  }

  async getAccountMetrics(
    tokens: OAuthTokens,
    dateRange?: { start: Date; end: Date }
  ): Promise<MetricsResult[]> {
    // Implementação requer Instagram Business Account
    return []
  }

  async subscribeWebhook(
    tokens: OAuthTokens,
    webhookUrl: string,
    events: string[]
  ): Promise<{ webhookId: string; verifyToken?: string }> {
    // Instagram usa Facebook Webhooks
    const response = await fetch(
      `${this.apiBaseUrl}/${process.env.FACEBOOK_APP_ID}/subscriptions?` +
      new URLSearchParams({
        access_token: tokens.accessToken,
        object: 'instagram',
        callback_url: webhookUrl,
        fields: events.join(','),
        verify_token: process.env.WEBHOOK_VERIFY_TOKEN || 'verify_token',
      }),
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error('Failed to subscribe webhook')
    }

    const data = await response.json()
    return {
      webhookId: data.id || 'webhook',
      verifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
    }
  }

  async unsubscribeWebhook(
    tokens: OAuthTokens,
    webhookId: string
  ): Promise<boolean> {
    const response = await fetch(
      `${this.apiBaseUrl}/${webhookId}?access_token=${tokens.accessToken}`,
      { method: 'DELETE' }
    )
    return response.ok
  }

  async validateTokens(tokens: OAuthTokens): Promise<boolean> {
    try {
      await this.getAccountInfo(tokens)
      return true
    } catch {
      return false
    }
  }

  async getAccountInfo(tokens: OAuthTokens): Promise<{
    userId: string
    username?: string
    name?: string
    avatar?: string
    metadata?: Record<string, any>
  }> {
    // Requer page access token e Instagram Business Account
    // Implementação simplificada
    return {
      userId: 'ig_user_id',
      username: 'instagram_user',
    }
  }

  private formatCaption(caption?: string, hashtags?: string[], mentions?: string[]): string {
    let formatted = caption || ''
    
    if (mentions && mentions.length > 0) {
      formatted += ' ' + mentions.map(m => `@${m}`).join(' ')
    }
    
    if (hashtags && hashtags.length > 0) {
      formatted += ' ' + hashtags.map(h => `#${h}`).join(' ')
    }
    
    return formatted.trim()
  }
}


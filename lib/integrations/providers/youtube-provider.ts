/**
 * YouTube Provider
 * 
 * Implementação para YouTube Data API v3
 * Docs: https://developers.google.com/youtube/v3
 */

import { BaseSocialProvider, type OAuthTokens, type PublishOptions, type PublishResult, type MediaUploadResult, type MetricsResult } from '../base-provider'

export class YouTubeProvider extends BaseSocialProvider {
  platform = 'YOUTUBE' as const
  name = 'YouTube'

  private clientId: string
  private clientSecret: string
  private apiBaseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor() {
    super()
    this.clientId = process.env.YOUTUBE_CLIENT_ID || ''
    this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET || ''
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code: ${error}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      scope: data.scope,
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh tokens')
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken, // Mantém o refresh token original
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  async revokeTokens(accessToken: string): Promise<boolean> {
    const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
    })
    return response.ok
  }

  async publishPost(
    tokens: OAuthTokens,
    mediaUrls: string[],
    options: PublishOptions
  ): Promise<PublishResult> {
    // YouTube requer upload direto do arquivo, não URL
    // Este método deve ser chamado com o arquivo já no S3
    // A implementação completa requer download do S3 e upload para YouTube
    
    try {
      // 1. Download do vídeo do S3
      const videoUrl = mediaUrls[0]
      if (!videoUrl) {
        throw new Error('Vídeo URL é obrigatório')
      }

      // 2. Upload para YouTube usando resumable upload
      // YouTube API requer upload em chunks para vídeos grandes
      const videoResponse = await this.uploadVideoResumable(
        tokens.accessToken,
        videoUrl,
        {
          title: options.title || 'Untitled',
          description: options.caption || '',
          tags: options.hashtags || [],
          privacyStatus: 'public',
          publishAt: options.scheduledAt?.toISOString(),
        }
      )

      return {
        success: true,
        postId: videoResponse.videoId,
        postUrl: `https://www.youtube.com/watch?v=${videoResponse.videoId}`,
        metadata: videoResponse,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to publish video',
      }
    }
  }

  async schedulePost(
    tokens: OAuthTokens,
    mediaUrls: string[],
    options: PublishOptions
  ): Promise<PublishResult> {
    // YouTube usa publishAt no upload, então é a mesma coisa
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
    // YouTube só aceita vídeos, não imagens isoladas
    if (mediaType !== 'video') {
      throw new Error('YouTube only accepts video uploads')
    }

    // Implementação simplificada - na prática precisa de resumable upload
    return {
      success: false,
      error: 'Use publishPost for video uploads',
    }
  }

  private async uploadVideoResumable(
    accessToken: string,
    videoUrl: string,
    metadata: {
      title: string
      description: string
      tags: string[]
      privacyStatus: string
      publishAt?: string
    }
  ): Promise<{ videoId: string }> {
    // 1. Criar resumable upload session
    const sessionResponse = await fetch(
      `${this.apiBaseUrl}/videos?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
          },
          status: {
            privacyStatus: metadata.privacyStatus,
            publishAt: metadata.publishAt,
          },
        }),
      }
    )

    if (!sessionResponse.ok) {
      throw new Error('Failed to create upload session')
    }

    const uploadUrl = sessionResponse.headers.get('Location')
    if (!uploadUrl) {
      throw new Error('No upload URL returned')
    }

    // 2. Download do vídeo e upload em chunks
    // Implementação completa requer streaming/chunked upload
    // Por enquanto, retornamos erro indicando que precisa implementação completa
    throw new Error('Resumable upload requires full implementation with chunked uploads')
  }

  async getPostMetrics(tokens: OAuthTokens, postId: string): Promise<MetricsResult> {
    const response = await fetch(
      `${this.apiBaseUrl}/videos?part=statistics,snippet&id=${postId}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get video metrics')
    }

    const data = await response.json()
    const video = data.items?.[0]

    if (!video) {
      throw new Error('Video not found')
    }

    const stats = video.statistics

    return {
      views: parseInt(stats.viewCount || '0'),
      likes: parseInt(stats.likeCount || '0'),
      comments: parseInt(stats.commentCount || '0'),
      metadata: {
        duration: video.contentDetails?.duration,
        publishedAt: video.snippet?.publishedAt,
      },
    }
  }

  async getAccountMetrics(
    tokens: OAuthTokens,
    dateRange?: { start: Date; end: Date }
  ): Promise<MetricsResult[]> {
    // YouTube Analytics API requer configuração adicional
    // Por enquanto retornamos array vazio
    return []
  }

  async subscribeWebhook(
    tokens: OAuthTokens,
    webhookUrl: string,
    events: string[]
  ): Promise<{ webhookId: string; verifyToken?: string }> {
    // YouTube não tem webhooks nativos, usa Pub/Sub ou polling
    throw new Error('YouTube does not support webhooks, use Pub/Sub or polling')
  }

  async unsubscribeWebhook(
    tokens: OAuthTokens,
    webhookId: string
  ): Promise<boolean> {
    return false
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
    const response = await fetch(
      `${this.apiBaseUrl}/channels?part=snippet,contentDetails&mine=true`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get account info')
    }

    const data = await response.json()
    const channel = data.items?.[0]

    if (!channel) {
      throw new Error('Channel not found')
    }

    return {
      userId: channel.id,
      username: channel.snippet?.customUrl,
      name: channel.snippet?.title,
      avatar: channel.snippet?.thumbnails?.default?.url,
      metadata: {
        subscriberCount: channel.statistics?.subscriberCount,
        videoCount: channel.statistics?.videoCount,
      },
    }
  }
}


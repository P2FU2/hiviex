/**
 * Facebook Pages — publicação via Graph API (vídeo por file_url, foto por url, ou feed texto).
 * Usa o mesmo FACEBOOK_APP_ID / FACEBOOK_APP_SECRET que o Instagram.
 */

import {
  BaseSocialProvider,
  type OAuthTokens,
  type PublishOptions,
  type PublishResult,
  type MediaUploadResult,
  type MetricsResult,
} from '../base-provider'

export class FacebookProvider extends BaseSocialProvider {
  platform = 'FACEBOOK' as const
  name = 'Facebook'

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
      state,
      scope: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'public_profile',
      ].join(','),
    })
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
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
      const t = await tokenResponse.text()
      throw new Error(`Facebook: falha ao trocar code por token: ${t}`)
    }

    const tokenData = await tokenResponse.json()
    const shortLivedToken = tokenData.access_token as string

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
      const t = await longLivedResponse.text()
      throw new Error(`Facebook: falha no token de longa duração: ${t}`)
    }

    const longLivedData = await longLivedResponse.json()

    return {
      accessToken: longLivedData.access_token as string,
      expiresAt: longLivedData.expires_in
        ? new Date(Date.now() + Number(longLivedData.expires_in) * 1000)
        : undefined,
    }
  }

  async refreshTokens(_refreshToken: string): Promise<OAuthTokens> {
    throw new Error(
      'Facebook: sem refresh automático — volta a ligar a conta nas integrações.'
    )
  }

  async revokeTokens(accessToken: string): Promise<boolean> {
    const response = await fetch(
      `${this.apiBaseUrl}/me/permissions?access_token=${encodeURIComponent(accessToken)}`,
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
      const pageId = options.metadata?.pageId as string | undefined
      if (!pageId) {
        throw new Error('Facebook: pageId em falta (metadata).')
      }

      const caption = this.formatCaption(options.caption, options.hashtags, options.mentions)
      const title = options.title?.trim() || ''
      const firstMime = options.metadata?.mediaMimeTypes?.[0] as string | undefined
      const mediaUrl = mediaUrls[0]
      const isVideo =
        !!firstMime?.startsWith('video/') || !!mediaUrl?.toLowerCase().includes('.mp4')

      if (mediaUrl && isVideo) {
        const params = new URLSearchParams({
          access_token: tokens.accessToken,
          file_url: mediaUrl,
          description: caption || title || ' ',
        })
        if (title) params.append('title', title)
        const res = await fetch(`${this.apiBaseUrl}/${pageId}/videos`, {
          method: 'POST',
          body: params,
        })
        if (!res.ok) {
          const err = await res.text()
          throw new Error(`Facebook vídeo: ${err}`)
        }
        const data = (await res.json()) as { id?: string }
        const vid = data.id
        return {
          success: true,
          postId: vid,
          postUrl: vid ? `https://www.facebook.com/watch/?v=${vid}` : undefined,
          metadata: { type: 'video' },
        }
      }

      if (mediaUrl) {
        const params = new URLSearchParams({
          access_token: tokens.accessToken,
          url: mediaUrl,
          caption: caption || ' ',
        })
        const res = await fetch(`${this.apiBaseUrl}/${pageId}/photos`, {
          method: 'POST',
          body: params,
        })
        if (!res.ok) {
          const err = await res.text()
          throw new Error(`Facebook foto: ${err}`)
        }
        const data = (await res.json()) as { id?: string; post_id?: string }
        const postId = data.post_id || data.id
        return {
          success: true,
          postId,
          postUrl: postId ? `https://www.facebook.com/${postId}` : undefined,
          metadata: { type: 'photo' },
        }
      }

      const params = new URLSearchParams({
        access_token: tokens.accessToken,
        message: caption || title || '.',
      })
      const res = await fetch(`${this.apiBaseUrl}/${pageId}/feed`, {
        method: 'POST',
        body: params,
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Facebook feed: ${err}`)
      }
      const data = (await res.json()) as { id?: string }
      return {
        success: true,
        postId: data.id,
        postUrl: data.id ? `https://www.facebook.com/${data.id}` : undefined,
        metadata: { type: 'feed' },
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return { success: false, error: msg }
    }
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
    return {
      success: false,
      error: 'Facebook: envia o ficheiro para a biblioteca (URL pública) e publica com file_url/url.',
    }
  }

  async getPostMetrics(
    tokens: OAuthTokens,
    postId: string
  ): Promise<MetricsResult> {
    const res = await fetch(
      `${this.apiBaseUrl}/${postId}?fields=shares&access_token=${encodeURIComponent(tokens.accessToken)}`
    )
    if (!res.ok) return {}
    const data = (await res.json()) as { shares?: { count?: number } }
    return { shares: data.shares?.count ?? 0 }
  }

  async getAccountMetrics(
    _tokens: OAuthTokens,
    _dateRange?: { start: Date; end: Date }
  ): Promise<MetricsResult[]> {
    return []
  }

  async subscribeWebhook(
    _tokens: OAuthTokens,
    _webhookUrl: string,
    _events: string[]
  ): Promise<{ webhookId: string; verifyToken?: string }> {
    throw new Error('Facebook: webhooks via app — não configurado neste fluxo.')
  }

  async unsubscribeWebhook(_tokens: OAuthTokens, _webhookId: string): Promise<boolean> {
    return false
  }

  async validateTokens(tokens: OAuthTokens): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.apiBaseUrl}/me?fields=id&access_token=${encodeURIComponent(tokens.accessToken)}`
      )
      return res.ok
    } catch {
      return false
    }
  }

  async getAccountInfo(tokens: OAuthTokens): Promise<{
    userId: string
    username?: string
    name?: string
    avatar?: string
    pageAccessToken?: string
    metadata?: Record<string, unknown>
  }> {
    const fields = 'id,name,access_token,picture{url}'
    const url =
      `${this.apiBaseUrl}/me/accounts?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(tokens.accessToken)}`

    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Facebook: falha ao listar páginas: ${text}`)
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string
        name: string
        access_token: string
        picture?: { data?: { url?: string } }
      }>
    }
    const pages = data.data || []
    if (pages.length === 0) {
      throw new Error(
        'Nenhuma Página do Facebook encontrada. Precisas de ser administrador de uma página e conceder pages_show_list.'
      )
    }

    const page = pages[0]
    return {
      userId: String(page.id),
      username: page.name,
      name: page.name,
      avatar: page.picture?.data?.url,
      pageAccessToken: page.access_token,
      metadata: {
        pageId: String(page.id),
      },
    }
  }

  private formatCaption(
    caption?: string,
    hashtags?: string[],
    mentions?: string[]
  ): string {
    let formatted = caption || ''
    if (mentions?.length) {
      formatted += ' ' + mentions.map((m) => `@${m}`).join(' ')
    }
    if (hashtags?.length) {
      formatted += ' ' + hashtags.map((h) => `#${h}`).join(' ')
    }
    return formatted.trim()
  }
}

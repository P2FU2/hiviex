# Integrações de Redes Sociais

## Arquitetura

### Componentes Principais

1. **Providers** (`lib/integrations/providers/`)
   - Implementações específicas de cada plataforma
   - YouTube, Instagram, Facebook, TikTok, etc.
   - Herdam de `BaseSocialProvider`

2. **Queue System** (`lib/queue/`)
   - BullMQ para gerenciar jobs de publicação
   - Redis como backend
   - Suporte a agendamento e retry

3. **Workers** (`lib/workers/`)
   - Processam jobs de publicação
   - Renovam tokens OAuth automaticamente
   - Atualizam status no banco

4. **Database Models** (`prisma/schema.prisma`)
   - `SocialAccount`: Contas conectadas (OAuth)
   - `ScheduledPost`: Posts agendados
   - `MediaAsset`: Arquivos de mídia
   - `PublishingJob`: Jobs BullMQ
   - `SocialMetrics`: Métricas das plataformas
   - `WebhookSubscription`: Webhooks configurados

## Fluxo de Publicação

```
1. Usuário agenda post → API cria ScheduledPost
2. API cria job no BullMQ → PublishingJob
3. Worker processa no horário agendado
4. Worker busca tokens OAuth (descriptografa)
5. Worker valida/renova tokens se necessário
6. Worker chama provider.publishPost()
7. Worker atualiza ScheduledPost com resultado
8. Worker atualiza PublishingJob com status
```

## OAuth Flow

```
1. GET /api/integrations/oauth/[platform]/init?tenantId=xxx
   → Redireciona para plataforma

2. Plataforma redireciona para:
   GET /api/integrations/oauth/[platform]?code=xxx&state=xxx
   → Salva tokens no SocialAccount
```

## Plataformas Suportadas

### ✅ YouTube
- **API**: YouTube Data API v3
- **OAuth**: Google OAuth 2.0
- **Escopos**: `youtube.upload`, `youtube`
- **Features**: Vídeos, Shorts, agendamento, métricas

### ✅ Instagram
- **API**: Instagram Graph API
- **Requisito**: Conta Business + Página Facebook
- **OAuth**: Facebook OAuth
- **Escopos**: `instagram_basic`, `instagram_content_publish`
- **Features**: Feed, Reels, agendamento, métricas

### ✅ Facebook (Páginas)
- **API**: Graph API — vídeo (`file_url` público), foto (`url`) ou post de texto
- **OAuth**: mesmo app Meta (`FACEBOOK_APP_ID` / `SECRET`) que o Instagram
- **Nota**: OAuth associa a **primeira** página devolvida por `/me/accounts`

### ⏳ TikTok / Kwai / Gmail
- **Status**: `PlannedSocialProvider` — sem crash na factory; publicação devolve erro controlado até integração real

## Configuração

### Variáveis de Ambiente

```env
# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# Facebook/Instagram
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Redis (BullMQ) — preferir URL (Upstash: rediss://...)
REDIS_URL=
# ou REDIS_HOST + REDIS_PORT + REDIS_PASSWORD (dev local)

# Webhooks
WEBHOOK_VERIFY_TOKEN=your_secret_token
```

### Iniciar Worker

```bash
npx tsx scripts/start-worker.ts
```

Ou em produção:
```bash
pm2 start scripts/start-worker.ts --name publishing-worker
```

## Segurança

Tokens OAuth são persistidos **cifrados** (`lib/utils/encryption`, `ENCRYPTION_KEY`). Tokens de página (Instagram/Facebook) ficam em `metadata.pageAccessTokenEnc`.

---

## Uso (API e dashboard)

### Ligar conta

1. UI: `/dashboard/integrations` → **Ligar conta** (YouTube, Instagram, Facebook quando disponível).
2. Ou redirecionar: `GET /api/integrations/oauth/{PLATFORM}/init?tenantId={tenantId}`

Callback: `GET /api/integrations/oauth/{PLATFORM}?code=&state=`

### Listar contas ligadas

`GET /api/integrations/social-accounts?tenantId=`

### Agendar publicação

`POST /api/integrations/posts/schedule` com JSON:

```json
{
  "tenantId": "...",
  "socialAccountId": "...",
  "platform": "YOUTUBE",
  "contentType": "video",
  "title": "Opcional",
  "caption": "Texto",
  "hashtags": [],
  "mentions": [],
  "scheduledAt": "2026-04-21T15:00:00.000Z",
  "mediaAssetIds": ["cuid-do-MediaAsset"],
  "config": {}
}
```

UI: formulário em `/dashboard/calendar` e no detalhe do projeto de vídeo (`SchedulePostForm`). Mídia deve existir na biblioteca (`/api/media`, upload S3 + `MediaAsset`).

### Workers

```bash
npm run worker
```

Inclui filas de publicação, vídeo (ingest, transcribe, clip, legendas, mux final), influenciadores e fluxos. Requer `REDIS_URL` compatível com BullMQ.

### Listar posts no período

`GET /api/integrations/posts?tenantId=&from=&to=` (usado pelo calendário editorial).


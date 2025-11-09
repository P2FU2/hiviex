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

### 🚧 Facebook
- **Status**: TODO
- **API**: Facebook Graph API
- **Features**: Posts em Páginas, agendamento

### 🚧 TikTok
- **Status**: TODO
- **Requisito**: Business Account + App aprovado
- **API**: TikTok Content Posting API

### 🚧 Kwai
- **Status**: TODO (Partner Program)

### 🚧 Gmail
- **Status**: TODO
- **Features**: Envio de e-mails, rascunhos

## Configuração

### Variáveis de Ambiente

```env
# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# Facebook/Instagram
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

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

### Tokens OAuth

⚠️ **IMPORTANTE**: Tokens devem ser criptografados antes de salvar no banco.

Implementar:
- Criptografia com AES-256-GCM
- Chave mestra no KMS (AWS/GCP) ou variável de ambiente
- Rotação de chaves

### Exemplo de Criptografia

```typescript
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

## Próximos Passos

1. ✅ Schema do banco criado
2. ✅ Base provider interface
3. ✅ YouTube provider (parcial)
4. ✅ Instagram provider (parcial)
5. ✅ Queue e Worker
6. 🚧 Criptografia de tokens
7. 🚧 Upload de mídia para S3
8. 🚧 Processamento de vídeo (FFmpeg)
9. 🚧 Webhooks handlers
10. 🚧 Métricas/Insights jobs
11. 🚧 Frontend de agendamento


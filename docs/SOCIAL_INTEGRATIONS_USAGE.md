# Como Usar as Integrações de Redes Sociais

## 1. Conectar uma Conta

### Frontend (Exemplo React)

```typescript
// Componente de conexão
function ConnectAccountButton({ platform, tenantId }: { platform: string, tenantId: string }) {
  const handleConnect = () => {
    // Redireciona para iniciar OAuth
    window.location.href = `/api/integrations/oauth/${platform}/init?tenantId=${tenantId}`
  }

  return (
    <button onClick={handleConnect}>
      Conectar {platform}
    </button>
  )
}
```

### Backend (OAuth Callback)

O callback é tratado automaticamente em:
- `app/api/integrations/oauth/[platform]/route.ts`

Após autorização, o usuário é redirecionado para:
- `/dashboard/integrations?success=YOUTUBE` (sucesso)
- `/dashboard/integrations?error=...` (erro)

## 2. Agendar um Post

### API Request

```typescript
POST /api/integrations/posts/schedule
Content-Type: application/json

{
  "tenantId": "tenant_123",
  "socialAccountId": "account_456",
  "platform": "YOUTUBE",
  "contentType": "video",
  "title": "Meu Vídeo Incrível",
  "caption": "Descrição do vídeo com #hashtags e @mentions",
  "hashtags": ["hashtag1", "hashtag2"],
  "mentions": ["user1", "user2"],
  "scheduledAt": "2025-01-15T14:30:00Z",
  "mediaAssetIds": ["asset_789"],
  "config": {
    "privacyStatus": "public",
    "thumbnailUrl": "https://cdn.example.com/thumb.jpg"
  }
}
```

### Response

```json
{
  "success": true,
  "post": {
    "id": "post_abc",
    "scheduledAt": "2025-01-15T14:30:00Z",
    "status": "SCHEDULED"
  },
  "jobId": "job_xyz"
}
```

## 3. Upload de Mídia

### Fluxo Recomendado

1. **Upload para S3** (usar AWS SDK ou similar)
2. **Criar MediaAsset no banco**
3. **Associar ao ScheduledPost**

```typescript
// Exemplo de upload
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: 'us-east-1' })

async function uploadMedia(file: File, tenantId: string) {
  // 1. Upload para S3
  const s3Key = `media/${tenantId}/${Date.now()}-${file.name}`
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: s3Key,
    Body: await file.arrayBuffer(),
    ContentType: file.type,
  }))

  // 2. Criar MediaAsset
  const response = await fetch('/api/integrations/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      mediaType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      s3Key,
      s3Bucket: process.env.S3_BUCKET,
    }),
  })

  return await response.json()
}
```

## 4. Verificar Status de um Post

```typescript
GET /api/integrations/posts/[postId]

Response:
{
  "id": "post_abc",
  "status": "PUBLISHED",
  "platformPostId": "yt_video_123",
  "platformPostUrl": "https://youtube.com/watch?v=...",
  "publishedAt": "2025-01-15T14:30:05Z",
  "scheduledAt": "2025-01-15T14:30:00Z"
}
```

## 5. Obter Métricas

```typescript
GET /api/integrations/posts/[postId]/metrics

Response:
{
  "views": 1250,
  "likes": 45,
  "comments": 12,
  "shares": 8,
  "reach": 3200,
  "impressions": 4500
}
```

## 6. Iniciar o Worker

### Desenvolvimento

```bash
npx tsx scripts/start-worker.ts
```

### Produção (PM2)

```bash
pm2 start scripts/start-worker.ts \
  --name publishing-worker \
  --instances 2 \
  --max-memory-restart 500M
```

### Docker

```dockerfile
# Dockerfile.worker
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npx", "tsx", "scripts/start-worker.ts"]
```

## 7. Monitoramento

### BullMQ Dashboard

```typescript
// Adicionar ao projeto
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'

// app/api/admin/queue/route.ts
const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
})

serverAdapter.setBasePath('/admin/queue')
```

### Logs

O worker loga automaticamente:
- ✅ Jobs completados
- ❌ Jobs falhados
- ⚠️ Erros

Verificar logs:
```bash
pm2 logs publishing-worker
```

## 8. Tratamento de Erros

### Retry Automático

BullMQ tenta automaticamente 3 vezes com backoff exponencial:
- Tentativa 1: Imediato
- Tentativa 2: Após 5s
- Tentativa 3: Após 10s

### Erros Comuns

1. **Token Expirado**
   - Worker renova automaticamente
   - Se falhar, marca conta como `EXPIRED`

2. **Mídia Não Encontrada**
   - Verificar se S3Key está correto
   - Verificar permissões do bucket

3. **Limite de Rate**
   - Implementar rate limiting no provider
   - Adicionar delay entre publicações

## 9. Escalabilidade

### Múltiplos Workers

```bash
# Worker 1
pm2 start scripts/start-worker.ts --name worker-1

# Worker 2
pm2 start scripts/start-worker.ts --name worker-2
```

BullMQ distribui jobs automaticamente entre workers.

### Redis Cluster

Para alta disponibilidade, usar Redis Cluster:

```typescript
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
}
```

## 10. Testes

### Teste Local

```typescript
// test/publishing.test.ts
import { PublishingQueue } from '@/lib/queue/publishing-queue'

test('schedule post', async () => {
  const queue = new PublishingQueue({
    host: 'localhost',
    port: 6379,
  })

  const jobId = await queue.schedulePost(
    'post_123',
    'tenant_456',
    'YOUTUBE',
    new Date(Date.now() + 60000) // 1 minuto
  )

  expect(jobId).toBeDefined()
})
```


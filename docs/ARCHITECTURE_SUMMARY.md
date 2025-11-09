# Resumo da Arquitetura de Integrações Sociais

## 🎯 O Que Foi Implementado

### 1. **Schema do Banco de Dados** ✅

Adicionados 6 novos modelos ao Prisma:

- **`SocialAccount`**: Armazena contas conectadas (OAuth tokens)
- **`ScheduledPost`**: Posts agendados para publicação
- **`MediaAsset`**: Arquivos de mídia (vídeos, imagens) no S3
- **`PublishingJob`**: Jobs do BullMQ para processar publicações
- **`SocialMetrics`**: Métricas coletadas das plataformas
- **`WebhookSubscription`**: Webhooks configurados

### 2. **Sistema de Providers** ✅

Arquitetura baseada em interfaces:

```
lib/integrations/
├── base-provider.ts          # Interface base
├── providers/
│   ├── youtube-provider.ts   # ✅ Implementado (parcial)
│   ├── instagram-provider.ts # ✅ Implementado (parcial)
│   └── index.ts              # Factory para criar providers
```

**Características:**
- Interface unificada (`BaseSocialProvider`)
- Cada plataforma implementa seus métodos
- Fácil adicionar novas plataformas

### 3. **Sistema de Filas (BullMQ)** ✅

```
lib/queue/
└── publishing-queue.ts       # Queue para agendar jobs

lib/workers/
└── publishing-worker.ts      # Worker que processa jobs
```

**Fluxo:**
1. API cria `ScheduledPost` no banco
2. API cria job no BullMQ com delay até `scheduledAt`
3. Worker processa no horário correto
4. Worker publica na plataforma
5. Worker atualiza status no banco

### 4. **APIs REST** ✅

```
app/api/integrations/
├── oauth/
│   └── [platform]/
│       ├── init/route.ts     # Inicia OAuth
│       └── route.ts          # Callback OAuth
└── posts/
    └── schedule/route.ts     # Agenda post
```

### 5. **Tipos Centralizados** ✅

Atualizado `lib/types/domain.ts` com tipos de redes sociais:
- `SocialPlatform`
- `SocialAccountStatus`
- `PostStatus`
- `MediaType`
- `JobStatus`

## 🔄 Fluxo Completo de Publicação

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ 1. POST /api/integrations/posts/schedule
       ▼
┌─────────────────────┐
│   API Route         │
│  (Next.js API)      │
└──────┬──────────────┘
       │ 2. Cria ScheduledPost
       │ 3. Cria PublishingJob
       │ 4. Adiciona job no BullMQ
       ▼
┌─────────────────────┐
│   Redis (BullMQ)    │
│   - Queue: pending  │
│   - Delay até hora  │
└──────┬──────────────┘
       │ 5. Job vira "active" no horário
       ▼
┌─────────────────────┐
│  Publishing Worker  │
│  (Background)       │
└──────┬──────────────┘
       │ 6. Busca ScheduledPost
       │ 7. Valida/renova tokens OAuth
       │ 8. Chama provider.publishPost()
       ▼
┌─────────────────────┐
│  Social Provider    │
│  (YouTube/IG/etc)   │
└──────┬──────────────┘
       │ 9. Publica na plataforma
       ▼
┌─────────────────────┐
│   Database          │
│  - Atualiza status  │
│  - Salva postId     │
│  - Salva URL        │
└─────────────────────┘
```

## 🏗️ Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  - Conectar contas (OAuth)                              │
│  - Agendar posts (Calendário/Kanban)                    │
│  - Upload de mídia                                      │
│  - Visualizar métricas                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Backend (Next.js API)                      │
│  - OAuth handlers                                       │
│  - CRUD de posts/mídias                                 │
│  - Agendamento de jobs                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│   PostgreSQL   │   │  Redis (BullMQ) │
│   - Dados      │   │  - Jobs          │
│   - Tokens     │   │  - Queue         │
└────────────────┘   └────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Publishing Worker │
                    │  (Background)      │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Social Providers  │
                    │  - YouTube API      │
                    │  - Instagram API    │
                    │  - Facebook API     │
                    └─────────────────────┘
```

## 🔐 Segurança

### Tokens OAuth

⚠️ **CRÍTICO**: Tokens devem ser criptografados antes de salvar.

**Implementação necessária:**
- AES-256-GCM para criptografia
- Chave mestra no KMS ou variável de ambiente
- Rotação de chaves periódica

### Validação

- State parameter no OAuth (previne CSRF)
- Verificação de acesso ao tenant
- Validação de tokens antes de publicar

## 📊 Escalabilidade

### Horizontal Scaling

- **Múltiplos Workers**: BullMQ distribui jobs automaticamente
- **Redis Cluster**: Para alta disponibilidade
- **Load Balancer**: Para API routes

### Vertical Scaling

- **Concurrency**: Workers processam múltiplos jobs simultaneamente
- **Rate Limiting**: Por plataforma (evitar bloqueios)

## 🚀 Próximos Passos

### Fase 1: Completar Implementação Base
- [ ] Criptografia de tokens OAuth
- [ ] Upload de mídia para S3
- [ ] Processamento de vídeo (FFmpeg)
- [ ] Frontend de agendamento

### Fase 2: Plataformas Adicionais
- [ ] Facebook Provider
- [ ] TikTok Provider
- [ ] Gmail Provider
- [ ] Kwai Provider (quando disponível)

### Fase 3: Features Avançadas
- [ ] Webhooks handlers
- [ ] Jobs de coleta de métricas
- [ ] Editor de mídia (thumbnails, cortes)
- [ ] Templates de posts
- [ ] Analytics dashboard

### Fase 4: Otimizações
- [ ] Cache de métricas
- [ ] Batch processing
- [ ] Retry inteligente
- [ ] Monitoring e alertas

## 📝 Notas Importantes

1. **Instagram**: Requer conta Business + Página Facebook
2. **TikTok**: Requer Business Account + App aprovado
3. **Kwai**: Requer Partner Program (acordo comercial)
4. **YouTube**: Suporta Shorts (mesma API)
5. **Tokens**: Sempre criptografar antes de salvar
6. **Rate Limits**: Respeitar limites de cada plataforma

## 🧪 Testes

```bash
# Testar worker localmente
npx tsx scripts/start-worker.ts

# Testar queue
npm run test:queue

# Testar providers
npm run test:providers
```

## 📚 Documentação

- [Arquitetura Completa](./SOCIAL_INTEGRATIONS.md)
- [Guia de Uso](./SOCIAL_INTEGRATIONS_USAGE.md)
- [API Reference](./API_REFERENCE.md) (TODO)


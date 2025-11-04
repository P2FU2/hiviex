# 📚 Guia de Setup - Plataforma SaaS HIVIEX

## 🚀 Passo a Passo de Implementação

### **FASE 1: Configuração Inicial**

#### 1.1 Instalar Dependências

```bash
npm install
```

#### 1.2 Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hiviex?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-uma-chave-secreta-aqui"

# OAuth Providers (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Redis (para BullMQ)
REDIS_URL="redis://localhost:6379"

# S3 Storage (Cloudflare R2 ou AWS S3)
S3_ENDPOINT=""
S3_REGION=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME=""
S3_PUBLIC_URL=""

# LLM Providers
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Sentry (opcional)
SENTRY_DSN=""

# Environment
NODE_ENV="development"
```

**Para gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### 1.3 Configurar PostgreSQL no Render

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Crie um novo **PostgreSQL Database**
3. Copie a **Internal Database URL** ou **External Database URL**
4. Cole no `.env` como `DATABASE_URL`
5. **Importante**: Para usar pgvector, você precisará habilitar a extensão no PostgreSQL

#### 1.4 Habilitar pgvector no PostgreSQL

Execute no banco de dados (via Render PostgreSQL console ou psql):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 1.5 Configurar Redis (Upstash)

1. Acesse [Upstash Console](https://console.upstash.com)
2. Crie um novo **Redis Database**
3. Copie a **Redis URL** (formato: `rediss://default:password@endpoint.upstash.io:6380`)
4. Cole no `.env` como `REDIS_URL`
5. **Importante**: Upstash usa TLS (rediss://) e porta 6380

Veja detalhes em `docs/UPSTASH_SETUP.md`

---

### **FASE 2: Banco de Dados**

#### 2.1 Gerar Prisma Client

```bash
npm run db:generate
```

#### 2.2 Criar Migração Inicial

```bash
npm run db:migrate
```

Isso criará todas as tabelas no banco de dados.

#### 2.3 (Opcional) Abrir Prisma Studio

```bash
npm run db:studio
```

Isso abrirá uma interface visual para ver e editar dados.

---

### **FASE 3: Autenticação**

#### 3.1 Verificar Configuração do NextAuth

O arquivo `lib/auth/config.ts` já está configurado. Certifique-se de:

- Ter as variáveis de ambiente configuradas
- Ter configurado pelo menos um provider (Email, Google ou GitHub)

#### 3.2 Testar Autenticação

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/api/auth/signin`
3. Teste o login

---

### **FASE 4: Estrutura de Workspaces (Multi-tenant)**

#### 4.1 Criar Workspace Inicial

Após login, criar API route para criar workspace:

```typescript
// app/api/workspaces/route.ts
// Implementar POST para criar workspace
```

#### 4.2 Middleware de Tenant

Criar middleware para identificar tenant do usuário:

```typescript
// middleware.ts
// Verificar tenant da sessão
```

---

### **FASE 5: CRUD de Agentes**

#### 5.1 Criar API Routes

- `app/api/agents/route.ts` - Listar e criar agentes
- `app/api/agents/[id]/route.ts` - Editar, deletar, obter agente

#### 5.2 Criar Interface de Dashboard

- `app/dashboard/agents/page.tsx` - Lista de agentes
- `app/dashboard/agents/[id]/page.tsx` - Editar agente
- `app/dashboard/agents/new/page.tsx` - Criar agente

---

### **FASE 6: Chat em Tempo Real**

#### 6.1 Configurar Socket.IO

1. Criar servidor Socket.IO
2. Configurar rooms por workspace
3. Integrar com LLM providers

#### 6.2 Criar Interface de Chat

- Componente de chat UI
- Integração com WebSocket
- Stream de respostas

---

### **FASE 7: Sistema de Filas**

#### 7.1 Configurar BullMQ Workers

1. Criar workers para jobs assíncronos
2. Configurar filas (postagens, crawling, ETL)
3. Integrar com Redis

---

### **FASE 8: LLM Providers**

#### 8.1 Implementar Provider Base

- Interface comum para todos os providers
- Implementar OpenAI
- Implementar Anthropic

#### 8.2 Integrar com Agentes

- Usar provider configurado no agente
- Gerar respostas
- Trackear uso (tokens)

---

### **FASE 9: Armazenamento S3**

#### 9.1 Configurar Cloudflare R2

1. Criar bucket no R2
2. Obter credenciais
3. Configurar no `.env`

#### 9.2 Implementar Upload

- Service para upload de mídias
- Integração com agentes
- CDN para delivery

---

### **FASE 10: Billing (Stripe)**

#### 10.1 Configurar Stripe

1. Criar conta Stripe
2. Obter API keys
3. Configurar webhooks

#### 10.2 Implementar Planos

- Criar produtos no Stripe
- Configurar preços
- Integrar com subscriptions

---

## 📋 Checklist de Implementação

- [ ] Fase 1: Configuração inicial
- [ ] Fase 2: Banco de dados
- [ ] Fase 3: Autenticação
- [ ] Fase 4: Workspaces
- [ ] Fase 5: CRUD de Agentes
- [ ] Fase 6: Chat em tempo real
- [ ] Fase 7: Sistema de filas
- [ ] Fase 8: LLM Providers
- [ ] Fase 9: Armazenamento S3
- [ ] Fase 10: Billing

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Database
npm run db:generate    # Gerar Prisma Client
npm run db:push        # Push schema (desenvolvimento)
npm run db:migrate     # Criar migração
npm run db:studio      # Abrir Prisma Studio

# Lint
npm run lint
```

---

## 📝 Próximos Passos

1. **Comece pela Fase 1 e 2** (Setup e Database)
2. **Teste a autenticação** (Fase 3)
3. **Implemente workspaces** (Fase 4)
4. **Crie agentes básicos** (Fase 5)
5. **Adicione chat** (Fase 6)
6. E assim por diante...

---

## 🆘 Troubleshooting

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

### Erro: "Database connection failed"
- Verifique `DATABASE_URL` no `.env`
- Verifique se o PostgreSQL está rodando
- Verifique firewall/network

### Erro: "Redis connection failed"
- Verifique `REDIS_URL` no `.env`
- Verifique se o Redis está rodando

### Erro: "pgvector extension not found"
Execute no PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 📚 Documentação Adicional

- [Plano de Implementação](./IMPLEMENTATION_PLAN.md)
- [Arquitetura](./ARCHITECTURE.md)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [BullMQ Docs](https://docs.bullmq.io)


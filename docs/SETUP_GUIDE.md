# 🚀 Guia de Configuração Completo - HIVIEX

> **⚠️ IMPORTANTE:** Se você já tem a aplicação rodando no Render, veja primeiro:
> - `ATUALIZAR_BANCO_RENDER.md` - Para atualizar o banco com novas tabelas
> - `docs/ATUALIZACAO_RENDER.md` - Guia completo de atualização

## Pré-requisitos

### 1. Node.js 20.x ou superior
```bash
# Verificar versão
node -v

# Se não tiver, instale: https://nodejs.org
```

### 2. PostgreSQL 15+
```bash
# Verificar se está instalado
psql --version

# Se não tiver, instale:
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql@15
# Linux: sudo apt-get install postgresql-15

# Ou use Docker:
docker run -d \
  --name postgres-hiviex \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hiviex \
  -p 5432:5432 \
  postgres:15
```

### 3. Redis 7+
```bash
# Verificar se está instalado
redis-cli --version

# Se não tiver, instale:
# Windows: https://github.com/microsoftarchive/redis/releases
# macOS: brew install redis
# Linux: sudo apt-get install redis-server

# Ou use Docker:
docker run -d \
  --name redis-hiviex \
  -p 6379:6379 \
  redis:7-alpine
```

## Passo a Passo

### 1. Clone e Instale Dependências

```bash
# Se ainda não clonou
git clone https://github.com/P2FU2/hiviex.git
cd hiviex

# Instalar dependências
npm install
```

### 2. Configurar Variáveis de Ambiente

#### Opção A: Script Automático (Recomendado)

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**Linux/macOS:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

#### Opção B: Manual

1. Copiar `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Editar `.env` com suas credenciais:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hiviex?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="" # Será gerado automaticamente pelo script

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Encryption (para tokens OAuth)
ENCRYPTION_KEY="" # Será gerado automaticamente pelo script
```

3. Gerar secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32
```

### 3. Configurar Banco de Dados

#### 3.1. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE hiviex;

# Criar usuário (opcional)
CREATE USER hiviex_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE hiviex TO hiviex_user;

# Sair
\q
```

#### 3.2. Atualizar DATABASE_URL no .env

```env
DATABASE_URL="postgresql://hiviex_user:sua_senha@localhost:5432/hiviex?schema=public"
```

#### 3.3. Aplicar Schema do Prisma

```bash
# Gerar Prisma Client
npm run db:generate

# Aplicar schema ao banco (cria tabelas)
npm run db:push

# OU criar migração (recomendado para produção)
npm run db:migrate
```

### 4. Configurar Redis

#### 4.1. Iniciar Redis

```bash
# Se instalado localmente
redis-server

# Ou com Docker (já deve estar rodando se usou o comando acima)
docker start redis-hiviex
```

#### 4.2. Testar Conexão

```bash
redis-cli ping
# Deve retornar: PONG
```

### 5. Configurar APIs OAuth (Opcional para começar)

#### YouTube

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto
3. Ative "YouTube Data API v3"
4. Crie credenciais OAuth 2.0
5. Adicione ao `.env`:
```env
YOUTUBE_CLIENT_ID="seu-client-id"
YOUTUBE_CLIENT_SECRET="seu-client-secret"
```

#### Facebook/Instagram

1. Acesse: https://developers.facebook.com/
2. Crie um App
3. Adicione produtos: "Facebook Login" e "Instagram Graph API"
4. Configure OAuth Redirect URIs
5. Adicione ao `.env`:
```env
FACEBOOK_APP_ID="seu-app-id"
FACEBOOK_APP_SECRET="seu-app-secret"
```

### 6. Configurar S3 (Opcional para começar)

#### AWS S3

1. Crie um bucket no AWS S3
2. Crie um usuário IAM com permissões S3
3. Adicione ao `.env`:
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
S3_BUCKET="hiviex-media"
```

#### Cloudflare R2 (Alternativa)

```env
AWS_REGION="auto"
AWS_ACCESS_KEY_ID="sua-r2-access-key"
AWS_SECRET_ACCESS_KEY="sua-r2-secret-key"
S3_BUCKET="hiviex-media"
S3_ENDPOINT="https://[account-id].r2.cloudflarestorage.com"
```

### 7. Iniciar Aplicação

#### Terminal 1: Next.js (Frontend + API)

```bash
npm run dev
```

Acesse: http://localhost:3000

#### Terminal 2: Worker (Publicação em Background)

```bash
npx tsx scripts/start-worker.ts
```

### 8. Verificar se Está Funcionando

1. Acesse http://localhost:3000
2. Faça login/cadastro
3. Crie um workspace
4. Tente criar um agente
5. Verifique logs do worker

## Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se PostgreSQL está rodando:
```bash
# Windows
Get-Service postgresql*

# Linux/macOS
sudo systemctl status postgresql
```

2. Verifique DATABASE_URL no `.env`
3. Teste conexão:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Erro: "Cannot connect to Redis"

**Solução:**
1. Verifique se Redis está rodando:
```bash
redis-cli ping
```

2. Verifique REDIS_HOST e REDIS_PORT no `.env`

### Erro: "Prisma Client not generated"

**Solução:**
```bash
npm run db:generate
```

### Erro: "Migration failed"

**Solução:**
1. Verifique se o banco existe
2. Verifique permissões do usuário
3. Tente resetar (CUIDADO: apaga dados):
```bash
npx prisma migrate reset
```

### Erro: "Module not found: reactflow"

**Solução:**
```bash
npm install
```

## Checklist de Configuração

- [ ] Node.js 20.x instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Redis instalado e rodando
- [ ] Arquivo `.env` criado e configurado
- [ ] `NEXTAUTH_SECRET` gerado
- [ ] `ENCRYPTION_KEY` gerado
- [ ] `DATABASE_URL` configurado
- [ ] Prisma Client gerado (`npm run db:generate`)
- [ ] Schema aplicado ao banco (`npm run db:push`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Next.js rodando (`npm run dev`)
- [ ] Worker rodando (`npx tsx scripts/start-worker.ts`)

## Próximos Passos

1. ✅ Configuração básica completa
2. 🔄 Configurar APIs OAuth (quando precisar)
3. 🔄 Configurar S3 (quando precisar)
4. 🔄 Criar primeiro workspace
5. 🔄 Conectar primeira conta social
6. 🔄 Agendar primeiro post

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia Next.js
npm run build            # Build para produção
npm run start            # Inicia produção

# Banco de Dados
npm run db:generate      # Gera Prisma Client
npm run db:push          # Aplica schema (dev)
npm run db:migrate       # Cria migração (prod)
npm run db:studio        # Abre Prisma Studio

# Qualidade
npm run typecheck        # Verifica tipos TypeScript
npm run lint             # Verifica código
npm run ci            # Tudo (typecheck + lint + build)

# Workers
npx tsx scripts/start-worker.ts  # Inicia worker de publicação
```

## Suporte

Se encontrar problemas:
1. Verifique os logs do terminal
2. Verifique logs do PostgreSQL: `tail -f /var/log/postgresql/postgresql.log`
3. Verifique logs do Redis: `redis-cli monitor`
4. Verifique arquivo `.env`
5. Execute `npm run typecheck` para ver erros de tipo

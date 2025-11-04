# ✅ Checklist de Verificação - Plataforma SaaS HIVIEX

## 🔍 Antes de Continuar para a Próxima Fase

Use este checklist para garantir que tudo está configurado corretamente.

---

## 1. 📦 Dependências Instaladas

- [ ] Executeu `npm install`
- [ ] Todas as dependências instaladas sem erros
- [ ] Verifique: `node_modules` existe e tem conteúdo

```bash
npm install
```

---

## 2. 🔐 Variáveis de Ambiente

- [ ] Arquivo `.env` criado na raiz do projeto
- [ ] `DATABASE_URL` configurado (PostgreSQL do Render)
- [ ] `NEXTAUTH_SECRET` configurado (gere com `openssl rand -base64 32`)
- [ ] `REDIS_URL` configurado (Upstash Redis - formato `rediss://...`)
- [ ] `NEXTAUTH_URL` configurado (ex: `http://localhost:3000`)

**Exemplo de `.env`:**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
REDIS_URL="rediss://default:password@endpoint.upstash.io:6380"
```

---

## 3. 🗄️ PostgreSQL

### 3.1 Banco de Dados Criado
- [ ] PostgreSQL criado no Render
- [ ] `DATABASE_URL` copiado e colado no `.env`
- [ ] Conexão testada (ver item 6)

### 3.2 Extensão pgvector
- [ ] Executou no banco: `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] Extensão verificada (ver item 6)

**Como executar:**
- Via Render PostgreSQL console
- Ou via psql: `psql DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"`

---

## 4. 🔴 Redis (Upstash)

- [ ] Redis criado no Upstash
- [ ] URL copiada (formato: `rediss://default:password@endpoint.upstash.io:6380`)
- [ ] `REDIS_URL` configurado no `.env`
- [ ] Conexão testada (ver item 6)

**Formato correto:**
```
rediss://default:SUA_SENHA@endpoint.upstash.io:6380
```

---

## 5. 🛠️ Prisma Setup

### 5.1 Gerar Prisma Client
- [ ] Executou: `npm run db:generate`
- [ ] Sem erros na geração

```bash
npm run db:generate
```

### 5.2 Criar Migração
- [ ] Executou: `npm run db:migrate`
- [ ] Migração criada com sucesso
- [ ] Tabelas criadas no banco

```bash
npm run db:migrate
```

**Nome da migração:** `initial_migration` ou similar

### 5.3 Verificar Tabelas
- [ ] Executou: `npm run test:db`
- [ ] Todas as tabelas aparecem como ✅

**Tabelas esperadas:**
- ✅ users
- ✅ accounts
- ✅ sessions
- ✅ verification_tokens
- ✅ tenants
- ✅ tenant_users
- ✅ agents
- ✅ messages
- ✅ workflows
- ✅ workflow_agents
- ✅ subscriptions
- ✅ usage_records
- ✅ embeddings

---

## 6. 🔌 Testes de Conexão

### 6.1 Testar Todas as Conexões
- [ ] Executou: `npm run test:connections`
- [ ] PostgreSQL: ✅ PASS
- [ ] Redis: ✅ PASS

```bash
npm run test:connections
```

### 6.2 Testar Banco Separadamente
- [ ] Executou: `npm run test:db`
- [ ] Todas as tabelas existem
- [ ] pgvector extension instalada

```bash
npm run test:db
```

---

## 7. 🏃 Servidor de Desenvolvimento

- [ ] Executou: `npm run dev`
- [ ] Servidor iniciou sem erros
- [ ] Acessou: `http://localhost:3000`
- [ ] Sem erros no console

```bash
npm run dev
```

---

## 8. 🔐 Autenticação

- [ ] Acessou: `http://localhost:3000/api/auth/signin`
- [ ] Página de login carregou
- [ ] (Opcional) Testou login com provider

---

## 9. 📝 Verificações Finais

### 9.1 Estrutura de Arquivos
- [ ] `prisma/schema.prisma` existe
- [ ] `lib/db/prisma.ts` existe
- [ ] `lib/queues/redis.ts` existe
- [ ] `lib/auth/config.ts` existe
- [ ] `middleware.ts` existe
- [ ] `app/api/auth/[...nextauth]/route.ts` existe
- [ ] `app/api/workspaces/route.ts` existe
- [ ] `app/api/agents/route.ts` existe

### 9.2 Documentação
- [ ] `docs/IMPLEMENTATION_PLAN.md` existe
- [ ] `docs/ARCHITECTURE.md` existe
- [ ] `docs/SETUP_GUIDE.md` existe
- [ ] `docs/UPSTASH_SETUP.md` existe
- [ ] `docs/VERIFICATION_CHECKLIST.md` (este arquivo) existe

---

## 🚨 Problemas Comuns

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

### Erro: "Database connection failed"
- Verifique `DATABASE_URL` no `.env`
- Verifique se o PostgreSQL está acessível
- Teste conexão: `npm run test:connections`

### Erro: "Redis connection failed"
- Verifique `REDIS_URL` no `.env`
- Formato correto: `rediss://default:password@endpoint.upstash.io:6380`
- Teste conexão: `npm run test:connections`

### Erro: "pgvector extension not found"
Execute no PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Erro: "Tables don't exist"
Execute migração:
```bash
npm run db:migrate
```

---

## ✅ Status Final

- [ ] **Todas as verificações acima completas**
- [ ] **Sem erros nos testes**
- [ ] **Pronto para próxima fase**

---

## 📚 Próximos Passos

Após completar este checklist:

1. ✅ **Fase 1-3**: Configuração base (FEITO)
2. ⏳ **Fase 4**: Dashboard de Workspaces
3. ⏳ **Fase 5**: Interface de Agentes
4. ⏳ **Fase 6**: Chat em Tempo Real
5. ⏳ **Fase 7**: Sistema de Filas
6. ⏳ **Fase 8**: Integração LLM
7. ⏳ **Fase 9**: Upload de Mídias
8. ⏳ **Fase 10**: Billing

---

**Última atualização:** Verifique todas as conexões antes de prosseguir!


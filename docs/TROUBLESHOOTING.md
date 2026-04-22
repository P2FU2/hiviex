# 🔧 Troubleshooting - Problemas Comuns

## ❌ Erro: "Can't reach database server"

### Problema
```
Error: P1001: Can't reach database server at `dpg-d44grdvgi27c73em53ig-a:5432`
```

### Causa
A `DATABASE_URL` no `.env` está usando a **URL interna** do Render, que só funciona dentro da rede do Render.

### Solução

1. **Acesse o Render Dashboard:**
   - Vá para seu PostgreSQL database
   - Clique em **"Connections"** ou **"Info"**

2. **Copie a External Database URL:**
   - Use a URL que começa com `postgresql://` (não `postgres://`)
   - Formato: `postgresql://user:password@host:5432/database?sslmode=require`

3. **Atualize o `.env`:**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

4. **Importante:**
   - ✅ Use **External Database URL** para desenvolvimento local
   - ✅ Use **Internal Database URL** apenas no Render (para produção)
   - ✅ Adicione `?sslmode=require` para conexões seguras

### Exemplo de URLs

**❌ ERRADO (Internal - só funciona no Render):**
```
postgresql://user:pass@dpg-xxx-a:5432/db
```

**✅ CORRETO (External - funciona localmente):**
```
postgresql://user:pass@dpg-xxx-a.oregon-postgres.render.com:5432/db?sslmode=require
```

---

## ❌ Erro: "Prisma Client not initialized"

### Problema
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

### Solução
```bash
npx prisma generate
```

---

## ❌ Erro: "pgvector extension not found"

### Problema
```
Error: extension "vector" does not exist
```

### Solução
Execute no banco de dados (via DBeaver, psql, ou Render Console):
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## ❌ Erro: "Redis connection failed"

### Problema
```
Redis connection error
```

### Solução

1. **Verifique a `REDIS_URL` no `.env`:**
   ```env
   REDIS_URL="rediss://default:password@endpoint.upstash.io:6380"
   ```

2. **Formato correto do Upstash:**
   - Protocolo: `rediss://` (com TLS)
   - Usuário: `default`
   - Porta: `6380` (TLS)
   - Formato completo: `rediss://default:senha@endpoint.upstash.io:6380`

3. **Teste a conexão:**
   ```bash
   npm run test:connections
   ```

---

## ❌ Erro: "Tables don't exist"

### Problema
Após gerar o Prisma Client, as tabelas não existem no banco.

### Solução

1. **Criar migração:**
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Ou fazer push do schema (desenvolvimento):**
   ```bash
   npx prisma db push
   ```

**⚠️ Importante:**
- `migrate dev` - cria migrações versionadas (recomendado para produção)
- `db push` - sincroniza schema sem migrações (apenas desenvolvimento)

---

## ❌ Erro: "tsx não reconhecido"

### Problema
```
'tsx' não é reconhecido como um comando interno
```

### Solução
Os scripts já estão corrigidos para usar `npx tsx`. Se ainda houver erro:

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Verificar se `tsx` está instalado:**
   ```bash
   npm list tsx
   ```

3. **Usar npx diretamente:**
   ```bash
   npx tsx scripts/test-connections.ts
   ```

---

## ✅ Checklist de Verificação

Antes de reportar um erro, verifique:

- [ ] `.env` existe e está configurado corretamente
- [ ] `DATABASE_URL` usa **External URL** (não Internal)
- [ ] `REDIS_URL` está no formato correto do Upstash
- [ ] Extensão `vector` está instalada no PostgreSQL
- [ ] `npx prisma generate` foi executado com sucesso
- [ ] `npm install` foi executado

---

## 📞 Ainda com Problemas?

1. **Verifique os logs:**
   - Erros do Prisma: console do terminal
   - Erros do banco: Render Dashboard → PostgreSQL → Logs
   - Erros do Redis: Upstash Dashboard → Logs

2. **Teste conexões:**
   ```bash
   npm run test:connections
   npm run test:db
   ```

3. **Documentação:** [docs/README.md](./README.md) (índice), [SETUP_GUIDE.md](./SETUP_GUIDE.md), [UPSTASH_SETUP.md](./UPSTASH_SETUP.md)

---

## Migrações Prisma e shadow database

Em CI ou `migrate dev`, se falhar por shadow DB inacessível, use URL externa ao Postgres ou `prisma migrate deploy` em produção sem shadow. Ver mensagem de erro do Prisma para `directUrl` se aplicável.

---

**Última atualização:** consolidado com documentação da raiz do repositório


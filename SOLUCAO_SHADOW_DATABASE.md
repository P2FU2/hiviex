# 🔧 Solução: Erro de Permissão no Shadow Database

## ❌ Problema

```
Error: ERROR: permission denied to terminate process
DETAIL: Only roles with the SUPERUSER attribute may terminate processes...
```

## 🔍 Causa

O comando `prisma migrate dev` tenta criar um **shadow database** para validar as migrações. O usuário do banco no Render não tem permissões de superuser necessárias para isso.

## ✅ Solução

### Opção 1: Usar `db push` (Recomendado para Desenvolvimento)

O `db push` sincroniza o schema diretamente sem criar shadow database:

```powershell
npx prisma db push
```

**Vantagens:**
- ✅ Não requer shadow database
- ✅ Funciona com usuários sem permissões de superuser
- ✅ Mais rápido para desenvolvimento
- ✅ Cria todas as tabelas automaticamente

**Desvantagens:**
- ❌ Não cria histórico de migrações
- ❌ Não é ideal para produção (use migrações versionadas)

### Opção 2: Desabilitar Shadow Database (Se quiser usar migrações)

Se você quiser usar migrações versionadas, pode desabilitar o shadow database:

1. **Adicione ao `.env`:**
   ```env
   PRISMA_MIGRATE_SKIP_GENERATE=1
   PRISMA_MIGRATE_SKIP_SEED=1
   ```

2. **Ou use flag:**
   ```powershell
   npx prisma migrate dev --name init --skip-seed
   ```

   Mas isso ainda pode dar erro se o Prisma tentar criar shadow database.

### Opção 3: Criar Migração Manualmente

Se você quiser migrações versionadas sem shadow database:

1. **Criar migração sem aplicar:**
   ```powershell
   npx prisma migrate dev --create-only --name init
   ```

2. **Aplicar manualmente:**
   ```powershell
   npx prisma migrate deploy
   ```

---

## 📋 Recomendação

### Para Desenvolvimento

Use `db push`:
```powershell
npx prisma db push
```

### Para Produção

1. **No ambiente local (com shadow database funcionando):**
   ```powershell
   npx prisma migrate dev --name nome_da_migracao
   ```

2. **No Render (sem shadow database):**
   ```powershell
   npx prisma migrate deploy
   ```

---

## ✅ Verificar se Funcionou

Após `db push`, verifique:

```powershell
npm run test:db
```

Isso listará todas as tabelas criadas.

---

## 🆘 Se Ainda Der Erro

### Erro: "Connection refused"

- Verifique se a `DATABASE_URL` está correta (External URL)
- Veja: `SOLUCAO_CONEXAO_BANCO.md`

### Erro: "Table already exists"

- As tabelas já existem no banco
- `db push` vai sincronizar sem problemas
- Ou delete as tabelas manualmente (cuidado!)

---

**Última atualização:** Solução para erro de shadow database


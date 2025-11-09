# 🚀 Configuração Rápida - HIVIEX

> **⚠️ ATENÇÃO:** Se você já tem a aplicação rodando no Render, **NÃO** use este guia!
> 
> Para atualizar o banco existente, veja: **`ATUALIZAR_BANCO_RENDER.md`**

## ⚡ Começar em 5 Minutos (Apenas para Setup Inicial)

### 1. Execute o Script de Configuração

**Windows (PowerShell):**
```powershell
.\configurar.ps1
```

O script vai:
- ✅ Instalar dependências
- ✅ Criar arquivo `.env` com secrets gerados
- ✅ Gerar Prisma Client
- ✅ Verificar PostgreSQL e Redis
- ✅ Oferecer para aplicar schema do banco

### 2. Configure PostgreSQL

**Opção A: Docker (Recomendado)**
```powershell
docker run -d --name postgres-hiviex -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hiviex -p 5432:5432 postgres:15
```

**Opção B: Instalar Localmente**
- Baixe: https://www.postgresql.org/download/windows/
- Instale e crie banco `hiviex`

### 3. Aplicar Schema do Banco

```powershell
npx prisma db push
```

### 4. Iniciar Aplicação

**Terminal 1:**
```powershell
npm run dev
```

**Terminal 2 (Opcional - Worker):**
```powershell
npx tsx scripts/start-worker.ts
```

### 5. Acessar

Abra: **http://localhost:3000**

## 📋 Checklist Mínimo

- [ ] Script `configurar.ps1` executado
- [ ] PostgreSQL rodando
- [ ] Arquivo `.env` criado
- [ ] `npx prisma db push` executado
- [ ] `npm run dev` funcionando
- [ ] Site abre em http://localhost:3000

## 🔧 Comandos Úteis

```powershell
# Verificar PostgreSQL
docker ps | Select-String postgres

# Verificar Redis
docker ps | Select-String redis

# Aplicar schema
npx prisma db push

# Ver banco de dados (interface visual)
npx prisma studio

# Verificar tipos
npm run typecheck
```

## ❌ Problemas?

### "Cannot connect to database"
1. Verifique se PostgreSQL está rodando
2. Verifique `DATABASE_URL` no `.env`
3. Teste: `docker exec -it postgres-hiviex psql -U postgres -c "SELECT 1"`

### "Prisma Client not generated"
```powershell
npx prisma generate
```

### "Module not found"
```powershell
npm install
```

## 📚 Mais Informações

- **Guia Completo**: `docs/SETUP_GUIDE.md`
- **Configuração Rápida**: `CONFIGURACAO_RAPIDA.md`
- **Passo a Passo**: `PASSO_A_PASSO.md`


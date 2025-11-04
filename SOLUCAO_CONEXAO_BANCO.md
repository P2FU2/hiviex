# 🔧 Solução: Erro de Conexão com Banco de Dados

## ❌ Problema Atual

```
Error: P1001: Can't reach database server at `dpg-d44grdvgi27c73em53ig-a:5432`
```

## 🔍 Causa

A `DATABASE_URL` no seu `.env` está usando a **URL interna** do Render, que **não funciona localmente**. A URL interna só funciona dentro da rede do Render.

## ✅ Solução Passo a Passo

### 1. Obter a URL Externa do Render

1. **Acesse o Render Dashboard:**
   - Vá para: https://dashboard.render.com
   - Entre na sua conta

2. **Encontre seu PostgreSQL:**
   - No menu lateral, clique em **"Databases"**
   - Clique no seu banco `hiviex_db` (ou nome similar)

3. **Copie a External Database URL:**
   - Procure por **"External Database URL"** ou **"Connection String (External)"**
   - Formato esperado: `postgresql://user:password@host.region-postgres.render.com:5432/database?sslmode=require`

### 2. Atualizar o `.env`

Abra o arquivo `.env` na raiz do projeto e atualize:

```env
# ❌ REMOVA ESTA (Internal - não funciona localmente)
# DATABASE_URL="postgresql://user:pass@dpg-xxx-a:5432/db"

# ✅ ADICIONE ESTA (External - funciona localmente)
DATABASE_URL="postgresql://user:password@dpg-xxx.oregon-postgres.render.com:5432/hiviex_db?sslmode=require"
```

**⚠️ Importante:**
- Use a URL que termina com `.render.com` (não apenas `dpg-xxx-a`)
- Adicione `?sslmode=require` para conexão segura
- A URL externa tem o hostname completo

### 3. Testar a Conexão

```bash
npx prisma migrate dev --name init
```

Se funcionar, você verá:
```
✔ Database synchronized successfully
```

### 4. Criar Migração (se necessário)

Se a conexão funcionar, execute:

```bash
npx prisma migrate dev --name init
```

Isso criará todas as tabelas no banco.

---

## 📊 Diferença entre URLs

### ❌ Internal Database URL
```
postgresql://user:pass@dpg-xxx-a:5432/db
```
- ✅ Funciona apenas dentro do Render
- ❌ Não funciona localmente
- Use apenas para serviços dentro do Render

### ✅ External Database URL
```
postgresql://user:pass@dpg-xxx.oregon-postgres.render.com:5432/db?sslmode=require
```
- ✅ Funciona localmente
- ✅ Funciona no Render
- ✅ Use para desenvolvimento local

---

## 🔐 Segurança

**⚠️ Importante:**
- A URL externa expõe o banco para a internet
- Use `?sslmode=require` para conexão segura
- Não compartilhe a URL
- Mantenha o `.env` no `.gitignore`

---

## ✅ Próximos Passos

Após corrigir a `DATABASE_URL`:

1. **Testar conexão:**
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Verificar tabelas:**
   ```bash
   npm run test:db
   ```

3. **Testar todas as conexões:**
   ```bash
   npm run test:connections
   ```

---

## 🆘 Ainda com Problemas?

1. **Verifique se o banco está rodando:**
   - Render Dashboard → Database → Status deve ser "Available"

2. **Verifique firewall/rede:**
   - Certifique-se de que sua rede permite conexões externas

3. **Teste com DBeaver ou outro cliente:**
   - Se funcionar no DBeaver, a URL está correta
   - Se não funcionar, verifique a URL novamente

---

**Última atualização:** Guia para corrigir conexão com banco


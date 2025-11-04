# 🔧 Como Corrigir o Erro de Migração

## ❌ Problema

```
Error: P3006
Migration `0001_add_vector_index` failed to apply cleanly to the shadow database.
Error: The underlying table for model `embeddings` does not exist.
```

## 🔍 Causa

Existem migrações antigas que tentam criar um índice na tabela `embeddings` **antes** da tabela existir. Isso acontece porque criamos migrações manuais antes de criar a migração inicial.

## ✅ Solução

### Opção 1: Remover Migrações Antigas (Recomendado)

**Execute no PowerShell no diretório do projeto:**

```powershell
# 1. Navegar para o diretório do projeto
cd "C:\Users\l191l\OneDrive\Área de Trabalho\hiviex"

# 2. Remover migrações antigas
Remove-Item -Path "prisma\migrations" -Recurse -Force

# 3. Criar migração inicial limpa
npx prisma migrate dev --name init
```

### Opção 2: Usar `db push` (Desenvolvimento)

Se você não precisa de histórico de migrações (apenas desenvolvimento):

```powershell
cd "C:\Users\l191l\OneDrive\Área de Trabalho\hiviex"
npx prisma db push
```

Isso criará todas as tabelas sem criar arquivos de migração.

---

## 📋 Passo a Passo Completo

### 1. Abrir PowerShell no Diretório do Projeto

1. Abra o **Explorador de Arquivos**
2. Navegue até: `C:\Users\l191l\OneDrive\Área de Trabalho\hiviex`
3. Clique com botão direito na pasta → **"Abrir no Terminal"** ou **"Abrir no PowerShell"**

### 2. Remover Migrações Antigas

```powershell
Remove-Item -Path "prisma\migrations" -Recurse -Force
```

### 3. Criar Migração Inicial

```powershell
npx prisma migrate dev --name init
```

**Resultado esperado:**
```
✔ Created migration: 20231104_init
✔ Applied migration: 20231104_init
```

### 4. (Opcional) Criar Índice do pgvector

Após a migração, execute no DBeaver ou via SQL:

```sql
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx 
ON embeddings 
USING ivfflat (embedding vector_l2_ops) 
WITH (lists = 100);
```

**Nota:** O índice do pgvector não pode estar no schema Prisma. Deve ser criado manualmente via SQL.

---

## ✅ Verificar se Funcionou

### 1. Testar Conexões

```powershell
npm run test:connections
```

### 2. Verificar Banco

```powershell
npm run test:db
```

### 3. Abrir Prisma Studio (Opcional)

```powershell
npm run db:studio
```

Isso abrirá uma interface visual para ver as tabelas.

---

## 🆘 Se Ainda Der Erro

### Erro: "Can't reach database server"

**Solução:** Verifique se a `DATABASE_URL` no `.env` está usando a **External URL** do Render (não a Internal).

Veja: `SOLUCAO_CONEXAO_BANCO.md`

### Erro: "Schema not found"

**Solução:** Certifique-se de estar no diretório correto do projeto:
```powershell
cd "C:\Users\l191l\OneDrive\Área de Trabalho\hiviex"
```

### Erro: "Table already exists"

**Solução:** Se as tabelas já existem, você pode:
1. Usar `npx prisma db push` para sincronizar
2. Ou deletar as tabelas manualmente (cuidado!)

---

## 📝 Resumo

1. ✅ Remover pasta `prisma\migrations`
2. ✅ Executar `npx prisma migrate dev --name init`
3. ✅ (Opcional) Criar índice pgvector via SQL
4. ✅ Testar com `npm run test:connections`

---

**Última atualização:** Guia para corrigir erro de migração


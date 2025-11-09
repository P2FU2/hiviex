# 🔄 Atualizar Banco de Dados no Render - Novas Tabelas Social Media

## 📋 Situação

- ✅ Aplicação já rodando no Render
- ✅ PostgreSQL já configurado e funcionando
- ✅ Variáveis de ambiente já configuradas
- 🆕 **NOVO:** Tabelas de Social Media adicionadas ao schema

## ⚡ Atualização Rápida (3 Passos)

### 1. Acessar Shell do Render

1. Vá para: https://dashboard.render.com
2. Clique no seu **Web Service** (não o banco)
3. Clique em **"Shell"** (ou "Console")
4. Isso abre um terminal dentro do ambiente do Render

### 2. Aplicar Mudanças no Banco

No Shell do Render, execute:

```bash
# Gerar Prisma Client com novos tipos
npm run db:generate

# Aplicar schema (cria novas tabelas sem afetar existentes)
npx prisma db push
```

**Isso vai:**
- ✅ Criar as novas tabelas de social media
- ✅ Manter todas as tabelas existentes intactas
- ✅ Não afetar dados existentes

### 3. Verificar

```bash
# Verificar se as tabelas foram criadas
npx prisma studio
```

Ou execute no PostgreSQL:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'social%';
```

## 📊 Tabelas que Serão Criadas

As seguintes tabelas serão adicionadas ao banco:

- `social_accounts` - Contas OAuth conectadas
- `scheduled_posts` - Posts agendados
- `media_assets` - Arquivos de mídia
- `publishing_jobs` - Jobs de publicação (BullMQ)
- `social_metrics` - Métricas das plataformas
- `webhook_subscriptions` - Webhooks configurados

## ⚠️ Importante

### ✅ Seguro
- `db push` **não remove** tabelas existentes
- **Não afeta** dados existentes
- **Não modifica** tabelas existentes (apenas adiciona novas)

### ⚠️ Atenção
- Se alguma tabela já existir com o mesmo nome, pode dar erro
- Nesse caso, verifique se já foi aplicado antes

## 🔍 Verificar Antes de Aplicar

Se quiser verificar o que será criado antes:

```bash
# Ver diferenças sem aplicar
npx prisma db push --preview-feature
```

## 🐛 Troubleshooting

### Erro: "Table already exists"
**Solução:** As tabelas já existem. Pode pular este passo.

### Erro: "Cannot connect to database"
**Solução:** 
1. Verifique se `DATABASE_URL` está configurada no Render
2. Verifique se o banco está rodando (status "Available")

### Erro: "Prisma Client not generated"
**Solução:**
```bash
npm run db:generate
```

## ✅ Checklist

- [ ] Acessou Shell do Render
- [ ] Executou `npm run db:generate`
- [ ] Executou `npx prisma db push`
- [ ] Verificou que tabelas foram criadas
- [ ] Aplicação ainda funciona normalmente

## 🚀 Após Atualizar

Depois de aplicar as mudanças, você pode:

1. **Configurar OAuth** (se ainda não fez):
   - Adicione variáveis no Render Dashboard:
     - `YOUTUBE_CLIENT_ID`
     - `YOUTUBE_CLIENT_SECRET`
     - `FACEBOOK_APP_ID`
     - `FACEBOOK_APP_SECRET`
     - etc.

2. **Configurar S3** (se ainda não fez):
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET`

3. **Configurar ENCRYPTION_KEY** (se ainda não tem):
   - Necessário para criptografar tokens OAuth
   - Adicione no Render Dashboard

## 📚 Documentação Completa

Veja `docs/ATUALIZACAO_RENDER.md` para mais detalhes.


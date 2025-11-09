# 🔄 Atualização no Render - Novas Tabelas de Social Media

## 📋 Situação Atual

A aplicação já está rodando no Render com:
- ✅ PostgreSQL configurado e funcionando
- ✅ Redis (Upstash) configurado e funcionando
- ✅ Variáveis de ambiente configuradas no Render Dashboard
- ✅ Aplicação em produção

## 🆕 O Que Foi Adicionado

Foram adicionadas novas tabelas no `prisma/schema.prisma` para integrações de redes sociais:

- `SocialAccount` - Contas conectadas (OAuth)
- `ScheduledPost` - Posts agendados
- `MediaAsset` - Assets de mídia (vídeos, imagens)
- `PublishingJob` - Jobs de publicação (BullMQ)
- `SocialMetrics` - Métricas das plataformas
- `WebhookSubscription` - Webhooks configurados

## 🔧 Como Aplicar as Mudanças

### Opção 1: Via Render Dashboard (Recomendado)

1. **Acesse o Render Dashboard**
   - Vá para: https://dashboard.render.com
   - Encontre seu Web Service

2. **Abra o Shell do Render**
   - Clique no seu Web Service
   - Vá em "Shell" (ou "Console")
   - Isso abre um terminal dentro do ambiente do Render

3. **Execute a Migração**
   ```bash
   # Gerar Prisma Client (se necessário)
   npm run db:generate
   
   # Aplicar schema (cria novas tabelas)
   npx prisma db push
   
   # OU criar migração formal (recomendado para produção)
   npx prisma migrate dev --name add_social_media_tables
   ```

4. **Verificar**
   ```bash
   # Verificar se as tabelas foram criadas
   npx prisma studio
   ```

### Opção 2: Via Deploy Automático

Se você tem CI/CD configurado, pode adicionar um script de build que aplica migrações:

1. **Adicione ao `package.json`:**
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "migrate": "prisma migrate deploy"
     }
   }
   ```

2. **No Render Dashboard:**
   - Vá em "Environment"
   - Adicione variável: `RUN_MIGRATIONS=true`
   - Modifique o build command para:
     ```bash
     npm install && npm run db:generate && npm run migrate && npm run build
     ```

### Opção 3: Via Migração Manual (Mais Seguro)

1. **Localmente, crie a migração:**
   ```bash
   npx prisma migrate dev --name add_social_media_tables --create-only
   ```

2. **Revise o arquivo gerado em `prisma/migrations/`**

3. **Aplique no Render:**
   ```bash
   # No Shell do Render
   npx prisma migrate deploy
   ```

## ⚠️ Importante

### Não Use `prisma db push` em Produção (se possível)

- `db push` é útil para desenvolvimento
- Para produção, use `prisma migrate deploy` (mais seguro)
- Migrações formais permitem rollback se necessário

### Backup Antes de Migrar

Se possível, faça backup do banco antes:
- Render oferece backups automáticos
- Ou exporte manualmente via `pg_dump`

## ✅ Verificação Pós-Migração

Após aplicar as mudanças, verifique:

1. **Tabelas criadas:**
   ```sql
   -- Execute no PostgreSQL do Render
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'social%';
   ```

2. **Prisma Client atualizado:**
   - O código deve compilar sem erros
   - TypeScript deve reconhecer os novos tipos

3. **API funcionando:**
   - Teste endpoints de social media
   - Verifique logs do Render

## 🔍 Troubleshooting

### Erro: "Table already exists"
- As tabelas já existem? Verifique antes de migrar
- Se sim, pode pular essa migração

### Erro: "Migration failed"
- Verifique logs do Render
- Verifique se há conflitos com dados existentes
- Considere fazer migração incremental

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

## 📝 Checklist

- [ ] Backup do banco feito (ou confiar nos backups automáticos do Render)
- [ ] Revisado o schema.prisma
- [ ] Migração criada/testada localmente (opcional)
- [ ] Aplicada migração no Render
- [ ] Verificado que tabelas foram criadas
- [ ] Verificado que aplicação ainda funciona
- [ ] Testado endpoints de social media (se já implementados)

## 🚀 Próximos Passos

Após aplicar as migrações:

1. Configure variáveis de ambiente para OAuth (se ainda não fez):
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`
   - etc.

2. Configure S3 (se ainda não fez):
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET`

3. Configure `ENCRYPTION_KEY` (se ainda não tem):
   - Necessário para criptografar tokens OAuth
   - Gere com: `openssl rand -hex 32`

## 📚 Referências

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Render Database](https://render.com/docs/databases)
- [Render Shell](https://render.com/docs/ssh)


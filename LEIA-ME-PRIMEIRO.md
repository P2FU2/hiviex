# 🚀 HIVIEX - Atualização do Banco de Dados

## ⚡ Você está rodando no Render?

Se **SIM**, siga este guia: **`ATUALIZAR_BANCO_RENDER.md`**

É um guia rápido de 3 passos para atualizar o banco existente com as novas tabelas de social media.

---

## 📋 O Que Foi Adicionado

Foram adicionadas novas funcionalidades de integração com redes sociais:

- ✅ Novas tabelas no banco (SocialAccount, ScheduledPost, MediaAsset, etc.)
- ✅ Sistema de OAuth para conectar contas
- ✅ Sistema de agendamento de posts
- ✅ Workers para publicação em background
- ✅ API routes para gerenciar integrações

## 🎯 Próximo Passo

**Se você já tem a aplicação rodando no Render:**

👉 **Leia:** `ATUALIZAR_BANCO_RENDER.md`

**Se você está configurando do zero:**

👉 **Leia:** `docs/SETUP_GUIDE.md`

---

## 📚 Documentação

- **Atualização no Render:** `ATUALIZAR_BANCO_RENDER.md` ⭐ **COMECE AQUI**
- **Guia Completo:** `docs/ATUALIZACAO_RENDER.md`
- **Arquitetura Social Media:** `docs/SOCIAL_INTEGRATIONS.md`
- **Resumo:** `RESUMO_ATUALIZACAO.md`

---

## ✅ Checklist Rápido

- [ ] Li `ATUALIZAR_BANCO_RENDER.md`
- [ ] Acessei Shell do Render
- [ ] Executei `npm run db:generate`
- [ ] Executei `npx prisma db push`
- [ ] Verifiquei que tabelas foram criadas
- [ ] Aplicação ainda funciona

---

**Última atualização:** Novas tabelas de Social Media adicionadas ao schema


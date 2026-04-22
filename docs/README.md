# Documentação HIVIEX

Índice único para desenvolvimento e operação. Documentos soltos na raiz do repo foram consolidados; use apenas esta pasta e o `README.md` principal.

## Início rápido

| Documento | Conteúdo |
|-----------|----------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Ambiente local, Prisma, Postgres, Redis |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | DB interno vs externo (Render), Prisma, Redis, pgvector |
| [AUTH_SETUP.md](./AUTH_SETUP.md) | NextAuth e sessão |

## Produto e integrações

| Documento | Conteúdo |
|-----------|----------|
| [SOCIAL_INTEGRATIONS.md](./SOCIAL_INTEGRATIONS.md) | OAuth, filas, workers, plataformas (YouTube, Instagram, Facebook, planeadas) |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Plano histórico / roadmap de funcionalidades |

## Infra e serviços

| Documento | Conteúdo |
|-----------|----------|
| [UPSTASH_SETUP.md](./UPSTASH_SETUP.md) | Redis (Upstash) |
| [ATUALIZACAO_RENDER.md](./ATUALIZACAO_RENDER.md) | Notas de deploy no Render (legado; ver também TROUBLESHOOTING) |

## Arquitetura

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Visão técnica da plataforma |

## Comandos úteis

```bash
npm run ci          # typecheck + lint + test + build
npm run worker      # BullMQ (publicação, vídeo, fluxos)
npm run test:connections
```

## Estrutura de código (resumo)

- `app/` — Next.js App Router (UI + `app/api/*`)
- `lib/` — domínio (auth, db, filas, workers, integrações, vídeo)
- `components/` — UI partilhada
- `prisma/` — schema e migrações
- `scripts/` — worker, diagnóstico de DB/Redis
- `tests/` — testes Node (`tsx --test`)

# ⚠️ IMPORTANTE: Regenerar Prisma Client

O Prisma Client precisa ser regenerado após as mudanças no schema para incluir os novos modelos (Flow, FlowNode, etc.).

## Passos para corrigir:

1. **Pare o servidor Next.js** (Ctrl+C no terminal)

2. **Regenere o Prisma Client:**
```bash
npx prisma generate
```

3. **Aplique as migrações do banco de dados:**
```bash
npx prisma migrate dev --name add_flow_builder
```

   OU se preferir apenas fazer push (sem criar migration):
```bash
npx prisma db push
```

4. **Reinicie o servidor:**
```bash
npm run dev
```

## O que foi adicionado ao schema:

- `Flow` - Fluxos visuais
- `FlowNode` - Nós do canvas
- `FlowConnection` - Conexões entre nós
- `FlowExecution` - Execuções de flows
- `FlowNodeExecution` - Execuções individuais de nós
- `AgentPersona` - Personalidade dos agentes
- `AgentAvatar` - Avatar visual dos agentes
- `Analytics` - Métricas e analytics

Todos esses modelos precisam estar disponíveis no Prisma Client para o código funcionar.


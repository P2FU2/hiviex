# 🔧 Solução: Erro com Internal Database URL no Deploy

## ❌ Problema

Usar a Internal Database URL no Render está dando erro no deploy.

## 🔍 Causas Possíveis

1. **Formato incorreto da URL**
2. **Falta de parâmetros SSL/connection pooling**
3. **Timing de conexão (serviço ainda não está pronto)**
4. **URL interna pode não funcionar em todos os contextos**

## ✅ Solução Implementada

### 1. Normalização Automática de URL

Criado `lib/db/connection.ts` que:
- Detecta automaticamente se é Internal ou External URL
- Adiciona parâmetros SSL quando necessário
- Adiciona connection pooling para melhor performance
- Funciona tanto com Internal quanto External URLs

### 2. Melhor Tratamento de Erros

- Mensagens de erro mais específicas
- Dicas de troubleshooting baseadas no código de erro
- Logs mais detalhados

## 📋 Como Configurar no Render

### Opção 1: Internal Database URL (Recomendado)

No Render Dashboard, use a **Internal Database URL**:
```
postgresql://user:pass@dpg-xxx-a:5432/db
```

O código agora:
- Detecta automaticamente que é Internal URL
- Adiciona `connect_timeout=10&pool_timeout=10`
- Não força SSL (pode não ser necessário internamente)

### Opção 2: External Database URL (Alternativa)

Se Internal URL não funcionar, use a **External Database URL**:
```
postgresql://user:pass@dpg-xxx.oregon-postgres.render.com:5432/db?sslmode=require
```

O código detecta automaticamente e garante SSL.

## 🧪 Como Testar

### 1. Verificar Health Check
```bash
curl https://hiviex.com/api/health/db
```

A resposta incluirá:
```json
{
  "database": {
    "connection": {
      "isInternal": true,
      "isExternal": false,
      "host": "dpg-xxx-a",
      "database": "dbname"
    }
  }
}
```

### 2. Testar Registro
Tente criar uma conta e verifique os logs no Render.

## 🐛 Troubleshooting

### Erro P1001: "Can't reach database server"

**Se usando Internal URL:**
1. Verifique se o formato está correto: `postgresql://user:pass@dpg-xxx-a:5432/db`
2. Verifique se o banco está na mesma região do serviço
3. Tente usar External URL como alternativa

**Se usando External URL:**
1. Adicione `?sslmode=require` ao final
2. Verifique se o host está correto (deve terminar com `.render.com`)

### Erro P1000: "Authentication failed"

1. Verifique usuário e senha
2. No Render, regenere a senha se necessário
3. Atualize o `DATABASE_URL` no Render Dashboard

### Erro P1011: "TLS error"

1. Adicione `?sslmode=require` ao DATABASE_URL
2. Se usar Internal URL, pode tentar sem SSL primeiro

## 📝 Checklist

- [ ] `DATABASE_URL` configurada no Render
- [ ] URL está no formato correto
- [ ] Health check `/api/health/db` retorna "healthy"
- [ ] Logs do Render não mostram erros de conexão
- [ ] Registro de usuário funciona

## 💡 Dica

Se Internal URL não funcionar, tente External URL com SSL:
```
postgresql://user:pass@dpg-xxx.region-postgres.render.com:5432/db?sslmode=require
```

O código detecta automaticamente e configura corretamente.


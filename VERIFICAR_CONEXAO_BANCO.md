# 🔍 Verificar Conexão com Banco de Dados em Produção

## 📋 Scripts e Endpoints Criados

### 1. Script de Teste Local
```bash
npm run test:db:connection
```

Este script testa:
- ✅ Conexão básica com o banco
- ✅ Execução de queries
- ✅ Existência de tabelas
- ✅ Extensão pgvector
- ✅ Contagem de usuários

### 2. Endpoint de Health Check (Produção)
```
GET /api/health/db
```

Este endpoint retorna:
- Status da conexão
- Informações do banco
- Contagem de usuários e tenants
- Status do pgvector
- Dicas de troubleshooting se houver erro

## 🚀 Como Usar

### Teste Local
```bash
npm run test:db:connection
```

### Teste em Produção
Acesse no navegador ou via curl:
```bash
curl https://hiviex.com/api/health/db
```

## 🔧 Verificar Configuração no Render

### 1. Verificar Variáveis de Ambiente

No Render Dashboard:
1. Vá para seu serviço (Web Service)
2. Clique em **"Environment"**
3. Verifique se `DATABASE_URL` está definida

### 2. Tipos de DATABASE_URL no Render

**Internal Database URL** (para uso dentro do Render):
```
postgresql://user:pass@dpg-xxx-a:5432/db
```
- ✅ Funciona apenas dentro da rede do Render
- ✅ Mais rápido (mesma rede)
- ✅ Use esta no Render (produção)

**External Database URL** (para acesso externo):
```
postgresql://user:pass@dpg-xxx.oregon-postgres.render.com:5432/db?sslmode=require
```
- ✅ Funciona de qualquer lugar
- ✅ Use esta para desenvolvimento local

### 3. Verificar Conexão

1. Acesse: `https://hiviex.com/api/health/db`
2. Verifique a resposta JSON:

**✅ Sucesso:**
```json
{
  "status": "healthy",
  "message": "Database connection successful",
  "database": {
    "connected": true,
    "users": 0,
    "tenants": 0,
    "pgvector": true
  }
}
```

**❌ Erro:**
```json
{
  "status": "error",
  "message": "Database connection failed",
  "error": "...",
  "code": "P1001",
  "troubleshooting": {
    "suggestions": [...]
  }
}
```

## 🐛 Troubleshooting

### Erro P1001: "Can't reach database server"
**Causa:** DATABASE_URL incorreta ou banco inacessível

**Solução:**
1. Verifique se está usando **Internal Database URL** no Render
2. Verifique se o banco está rodando
3. Verifique se não há firewall bloqueando

### Erro P1000: "Authentication failed"
**Causa:** Credenciais incorretas

**Solução:**
1. Verifique usuário e senha no DATABASE_URL
2. Regenere a senha no Render se necessário

### Erro P1011: "TLS error"
**Causa:** Falta de SSL/TLS

**Solução:**
1. Adicione `?sslmode=require` ao DATABASE_URL

## 📝 Checklist

- [ ] `DATABASE_URL` configurado no Render
- [ ] Usando **Internal Database URL** (para produção)
- [ ] Endpoint `/api/health/db` retorna status "healthy"
- [ ] Script `npm run test:db:connection` funciona localmente
- [ ] Logs do servidor não mostram erros de conexão

## 🔍 Verificar Logs do Render

1. No Render Dashboard
2. Vá para seu serviço
3. Clique em **"Logs"**
4. Procure por:
   - `DATABASE_URL`
   - `P1001`, `P1000`, `P1011` (códigos de erro Prisma)
   - `Connection error`


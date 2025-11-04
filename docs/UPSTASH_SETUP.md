# 🔧 Configuração Upstash Redis

## 📋 Setup do Upstash Redis

### 1. Criar Instância no Upstash

1. Acesse [Upstash Console](https://console.upstash.com)
2. Crie um novo **Redis Database**
3. Escolha a região mais próxima
4. Copie as credenciais:
   - **UPSTASH_REDIS_REST_URL** (para REST API)
   - **UPSTASH_REDIS_REST_TOKEN** (para REST API)
   - **UPSTASH_REDIS_URL** (para conexão direta via ioredis)

### 2. Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Upstash Redis (opção 1 - URL direta com TLS)
REDIS_URL="rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6380"

# Upstash Redis (opção 2 - REST API)
# UPSTASH_REDIS_REST_URL="https://YOUR_ENDPOINT.upstash.io"
# UPSTASH_REDIS_REST_TOKEN="YOUR_TOKEN"

# O código está configurado para usar REDIS_URL primeiro
# Se usar REST API, configure as variáveis UPSTASH_*
```

### 3. Formato da URL do Upstash

O Upstash fornece URLs no formato:
```
rediss://default:password@endpoint.upstash.io:6380
```

Onde:
- `rediss://` = Redis com TLS
- `default` = usuário padrão
- `password` = sua senha
- `endpoint` = endpoint do Upstash
- `6380` = porta TLS

### 4. Testar Conexão

Execute o script de teste:

```bash
npm run test:connections
```

Isso testará tanto PostgreSQL quanto Redis.

### 5. Verificar no Código

O arquivo `lib/queues/redis.ts` está configurado para:
- ✅ Suportar TLS (rediss://)
- ✅ Suportar formato Upstash
- ✅ Retry automático
- ✅ Logs de conexão

---

## 🔍 Troubleshooting

### Erro: "Connection refused"
- Verifique se a URL está correta
- Verifique se está usando `rediss://` (com TLS) e porta `6380`

### Erro: "TLS handshake failed"
- O Upstash requer TLS, mas o código já está configurado para isso
- Verifique se não está bloqueado por firewall

### Erro: "Authentication failed"
- Verifique se a senha está correta na URL
- A senha vem após `default:` na URL

### Testar Manualmente

```bash
# Com redis-cli (se instalado)
redis-cli -u "rediss://default:password@endpoint.upstash.io:6380" ping
```

---

## 📚 Referências

- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [ioredis TLS](https://github.com/redis/ioredis#tls-options)


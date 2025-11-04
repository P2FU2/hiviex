# 🔧 Configurar DATABASE_URL no Render

## 📋 Informações do Seu Banco de Dados

**Hostname (Internal):** `dpg-d44grdvgi27c73em53ig-a`  
**Porta:** `5432`  
**Database:** `hiviviex_db`  
**Username:** `hiviviex_db_user`  
**Password:** `G6qzPY31pWtGpJ3gkNVlng1FIiRMrnka`

## ✅ URL para Usar no Render (Internal)

Para usar no Render Dashboard (Web Service), use a **Internal Database URL**:

```
postgresql://hiviviex_db_user:G6qzPY31pWtGpJ3gkNVlng1FIiRMrnka@dpg-d44grdvgi27c73em53ig-a:5432/hiviviex_db
```

**Nota:** Adicionei `:5432` após o hostname, pois a URL do Render às vezes não inclui a porta explicitamente.

## 📝 Passo a Passo para Configurar

### 1. Acesse o Render Dashboard
- Vá para: https://dashboard.render.com
- Faça login na sua conta

### 2. Vá para seu Web Service
- No menu lateral, clique em **"Services"** ou **"Web Services"**
- Clique no serviço que roda a aplicação HIVIEX (não o banco de dados)

### 3. Adicione a Variável de Ambiente
1. Clique na aba **"Environment"** (ou "Env" no menu)
2. Clique em **"Add Environment Variable"** ou **"Add Variable"**
3. Preencha:
   - **Key:** `DATABASE_URL`
   - **Value:** Cole a URL completa:
     ```
     postgresql://hiviviex_db_user:G6qzPY31pWtGpJ3gkNVlng1FIiRMrnka@dpg-d44grdvgi27c73em53ig-a:5432/hiviviex_db
     ```
4. Clique em **"Save Changes"**

### 4. Render Fará Redeploy Automaticamente
- O Render detectará a mudança e fará redeploy automaticamente
- Aguarde o deploy completar (geralmente 2-5 minutos)

## 🧪 Verificar se Funcionou

Após o redeploy completar, teste:

```bash
curl https://hiviviex.com/api/health/db
```

**Resposta esperada (sucesso):**
```json
{
  "status": "healthy",
  "message": "Database connection successful",
  "database": {
    "connected": true,
    "users": 0,
    "tenants": 0,
    "pgvector": true,
    "connection": {
      "host": "dpg-d44grdvgi27c73em53ig-a",
      "database": "hiviviex_db",
      "isInternal": true,
      "isExternal": false
    }
  }
}
```

## 🔍 Alternativa: External URL (se Internal não funcionar)

Se a Internal URL não funcionar, tente a External URL com SSL:

```
postgresql://hiviviex_db_user:G6qzPY31pWtGpJ3gkNVlng1FIiRMrnka@dpg-d44grdvgi27c73em53ig-a.oregon-postgres.render.com:5432/hiviviex_db?sslmode=require
```

**Nota:** A External URL funciona de qualquer lugar, mas a Internal é mais rápida dentro da rede do Render.

## ⚠️ Importante

1. **Não compartilhe** essas credenciais publicamente
2. **Mantenha** o `.env` no `.gitignore` (já está configurado)
3. **Use Internal URL** para produção no Render (mais rápida)
4. **Use External URL** apenas se Internal não funcionar

## 🐛 Troubleshooting

### Erro: "Cannot reach database server"
- Verifique se está usando Internal URL (não External) no Render
- Verifique se a porta `:5432` está incluída
- Aguarde alguns minutos após adicionar a variável (pode levar tempo para propagar)

### Erro: "Authentication failed"
- Verifique se copiou a senha corretamente
- Tente regenerar a senha no Render se necessário

### Erro: "Connection timeout"
- Verifique se o banco está rodando (status "Available" no Render)
- Tente usar External URL como alternativa

## ✅ Checklist

- [ ] Acessou o Render Dashboard
- [ ] Encontrou o Web Service (não o banco)
- [ ] Adicionou `DATABASE_URL` nas variáveis de ambiente
- [ ] Colou a Internal Database URL completa
- [ ] Salvou as mudanças
- [ ] Aguardou o redeploy completar
- [ ] Testou `/api/health/db` e retornou "healthy"

---

**Última atualização:** Guia para configurar DATABASE_URL no Render com suas credenciais específicas


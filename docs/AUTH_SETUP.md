# 🔐 Configuração de Autenticação - HIVIEX

## 📋 Visão Geral

O sistema de autenticação do HIVIEX usa NextAuth.js v5 beta com suporte a múltiplos providers:
- **Credentials** (Email/Senha) - Login direto consultando banco de dados
- **Google OAuth** - Login com conta Google
- **GitHub OAuth** - Login com conta GitHub
- **Email Provider** - Login via email (opcional, requer SMTP)

## ✅ Verificação de Credenciais

### 1. Credentials Provider (Email/Senha)

O login com email/senha **sempre consulta o banco de dados**:
- Valida se o usuário existe no banco
- Verifica se o usuário tem uma conta de credenciais criada
- Compara a senha usando bcrypt (hash seguro)
- **Só permite login se a conta foi criada previamente**

**Fluxo de Registro:**
1. Usuário preenche formulário de signup
2. Sistema valida email e senha
3. Cria usuário no banco de dados via `/api/auth/register`
4. Senha é hasheada com bcrypt antes de armazenar
5. Redireciona para login após criação bem-sucedida

**Fluxo de Login:**
1. Usuário preenche email/senha
2. Sistema busca usuário no banco por email
3. Verifica se existe conta de credenciais
4. Compara senha com hash armazenado
5. Retorna erro se usuário não existe ou senha incorreta

### 2. OAuth Providers (Google/GitHub)

OAuth providers também consultam o banco:
- Usuário é criado automaticamente no primeiro login
- Armazenado na tabela `users` e `accounts`
- PrismaAdapter gerencia automaticamente

## 🔑 Variáveis de Ambiente Necessárias

Adicione ao arquivo `.env`:

```env
# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui-gerado-aleatoriamente"
NEXTAUTH_URL="http://localhost:3000" # ou sua URL de produção

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID="seu-github-client-id"
GITHUB_CLIENT_SECRET="seu-github-client-secret"

# SMTP para Email Provider (opcional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="seu-email@example.com"
SMTP_PASSWORD="sua-senha-smtp"
SMTP_FROM="noreply@hiviex.com"
```

## 🚀 Como Configurar OAuth

### Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Configure:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Para produção: `https://seu-dominio.com/api/auth/callback/google`
6. Copie o **Client ID** e **Client Secret**
7. Adicione ao `.env`

### GitHub OAuth

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em **New OAuth App**
3. Configure:
   - Application name: HIVIEX
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Para produção: `https://seu-dominio.com/api/auth/callback/github`
4. Copie o **Client ID** e gere um **Client Secret**
5. Adicione ao `.env`

## 🔒 Segurança

### Senhas
- Senhas são hasheadas com bcrypt (10 rounds)
- Nunca armazenadas em texto plano
- Hash armazenado no campo `access_token` da tabela `accounts`

### Validação
- Email deve ser único
- Senha mínima de 6 caracteres
- Validação no backend antes de criar conta

### Sessões
- Usa JWT strategy
- Token contém apenas ID do usuário
- Sessões expiram automaticamente

## 📊 Estrutura do Banco de Dados

### Tabela `users`
```sql
- id (String, PK)
- email (String, Unique)
- name (String, Optional)
- emailVerified (DateTime, Optional)
- image (String, Optional)
- createdAt, updatedAt
```

### Tabela `accounts`
```sql
- id (String, PK)
- userId (String, FK -> users.id)
- type (String) - 'credentials', 'oauth', etc.
- provider (String) - 'credentials', 'google', 'github'
- providerAccountId (String) - email ou ID do OAuth
- access_token (String) - hash da senha (credentials) ou OAuth token
```

## 🧪 Testando Autenticação

### Teste de Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123",
    "name": "Test User"
  }'
```

### Teste de Login
1. Acesse `http://localhost:3000`
2. Clique em "Sign Up" ou "Login"
3. Preencha email/senha
4. Após login, deve redirecionar para `/dashboard`

### Verificar no Banco
```sql
-- Ver usuários criados
SELECT * FROM users;

-- Ver contas de credenciais
SELECT * FROM accounts WHERE provider = 'credentials';

-- Ver contas OAuth
SELECT * FROM accounts WHERE provider IN ('google', 'github');
```

## ✅ Checklist de Verificação

- [ ] `NEXTAUTH_SECRET` configurado no `.env`
- [ ] `NEXTAUTH_URL` configurado (localhost para dev, produção para prod)
- [ ] Google OAuth configurado (se usar)
- [ ] GitHub OAuth configurado (se usar)
- [ ] Banco de dados conectado e migrado
- [ ] Prisma Client gerado (`npm run db:generate`)
- [ ] Teste de registro funcionando
- [ ] Teste de login funcionando
- [ ] Redirecionamento para `/dashboard` após login
- [ ] Proteção de rotas `/dashboard` funcionando

## 🐛 Troubleshooting

### Erro: "Invalid email or password"
- Verifique se o usuário foi criado no banco
- Verifique se a senha está correta
- Verifique se existe conta de credenciais na tabela `accounts`

### Erro: "Please sign in with Google or GitHub"
- Usuário existe mas não tem conta de credenciais
- Criou conta via OAuth, precisa usar OAuth para login

### Erro: "Nodemailer requires a server configuration"
- EmailProvider está sendo inicializado sem SMTP configurado
- Solução: Configure SMTP no `.env` ou remova EmailProvider

### OAuth não funciona
- Verifique se as credenciais estão corretas no `.env`
- Verifique se as redirect URIs estão corretas
- Verifique se o app OAuth está ativo no provider


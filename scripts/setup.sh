#!/bin/bash

# Script de Setup - HIVIEX
# Execute: chmod +x scripts/setup.sh && ./scripts/setup.sh

set -e

echo "🚀 Configurando HIVIEX..."

# 1. Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 20.x: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20.x ou superior é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# 2. Verificar PostgreSQL
echo "📦 Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL não encontrado. Instale PostgreSQL: https://www.postgresql.org/download/"
    echo "   Ou use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15"
else
    echo "✅ PostgreSQL encontrado"
fi

# 3. Verificar Redis
echo "📦 Verificando Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis não encontrado. Instale Redis: https://redis.io/download"
    echo "   Ou use Docker: docker run -d -p 6379:6379 redis:7-alpine"
else
    echo "✅ Redis encontrado"
fi

# 4. Instalar dependências
echo "📦 Instalando dependências npm..."
npm install

# 5. Copiar .env.example para .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env a partir de .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais!"
else
    echo "✅ Arquivo .env já existe"
fi

# 6. Gerar NEXTAUTH_SECRET se não existir
if ! grep -q "NEXTAUTH_SECRET=" .env || grep -q "NEXTAUTH_SECRET=\"\"" .env; then
    echo "🔐 Gerando NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXTAUTH_SECRET=\"\"|NEXTAUTH_SECRET=\"$SECRET\"|" .env
    else
        # Linux
        sed -i "s|NEXTAUTH_SECRET=\"\"|NEXTAUTH_SECRET=\"$SECRET\"|" .env
    fi
    echo "✅ NEXTAUTH_SECRET gerado"
fi

# 7. Gerar ENCRYPTION_KEY se não existir
if ! grep -q "ENCRYPTION_KEY=" .env || grep -q "ENCRYPTION_KEY=\"\"" .env; then
    echo "🔐 Gerando ENCRYPTION_KEY..."
    KEY=$(openssl rand -hex 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|ENCRYPTION_KEY=\"\"|ENCRYPTION_KEY=\"$KEY\"|" .env
    else
        # Linux
        sed -i "s|ENCRYPTION_KEY=\"\"|ENCRYPTION_KEY=\"$KEY\"|" .env
    fi
    echo "✅ ENCRYPTION_KEY gerado"
fi

# 8. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npm run db:generate

# 9. Aplicar migrações do banco
echo "🗄️  Aplicando migrações do banco..."
echo "⚠️  Certifique-se de que o PostgreSQL está rodando e DATABASE_URL está correto no .env"
read -p "Deseja aplicar as migrações agora? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    npm run db:push
    echo "✅ Migrações aplicadas"
else
    echo "⏭️  Pulando migrações. Execute depois: npm run db:push"
fi

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas credenciais"
echo "2. Configure suas APIs OAuth (YouTube, Facebook, etc.)"
echo "3. Configure Redis e PostgreSQL"
echo "4. Execute: npm run dev"
echo "5. Em outro terminal, execute: npx tsx scripts/start-worker.ts"


#!/bin/bash

# Script para aplicar migrações no Render
# Execute no Shell do Render Dashboard

set -e

echo "🔄 Aplicando migrações do Prisma no Render..."
echo ""

# 1. Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npm run db:generate

# 2. Aplicar migrações
echo "🗄️  Aplicando migrações..."
npx prisma migrate deploy

# 3. Verificar
echo "✅ Migrações aplicadas!"
echo ""
echo "📋 Verificando tabelas criadas..."
npx prisma studio --browser none &
echo ""
echo "✅ Concluído!"
echo ""
echo "💡 Dica: Use 'npx prisma studio' para ver o banco visualmente"


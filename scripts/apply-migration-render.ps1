# Script para aplicar migrações no Render (PowerShell)
# Execute no Shell do Render Dashboard

Write-Host "🔄 Aplicando migrações do Prisma no Render..." -ForegroundColor Cyan
Write-Host ""

# 1. Gerar Prisma Client
Write-Host "📦 Gerando Prisma Client..." -ForegroundColor Yellow
npm run db:generate

# 2. Aplicar migrações
Write-Host "🗄️  Aplicando migrações..." -ForegroundColor Yellow
npx prisma migrate deploy

# 3. Verificar
Write-Host "✅ Migrações aplicadas!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Para verificar, execute:" -ForegroundColor Cyan
Write-Host "   npx prisma studio" -ForegroundColor White
Write-Host ""


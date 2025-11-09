# Script de Setup - HIVIEX (PowerShell)
# Execute: .\scripts\setup.ps1

Write-Host "🚀 Configurando HIVIEX..." -ForegroundColor Cyan

# 1. Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale Node.js 20.x: https://nodejs.org" -ForegroundColor Red
    exit 1
}

$nodeVersion = (node -v).Substring(1).Split('.')[0]
if ([int]$nodeVersion -lt 20) {
    Write-Host "❌ Node.js 20.x ou superior é necessário. Versão atual: $(node -v)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $(node -v) encontrado" -ForegroundColor Green

# 2. Verificar PostgreSQL
Write-Host "📦 Verificando PostgreSQL..." -ForegroundColor Yellow
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  PostgreSQL não encontrado. Instale PostgreSQL ou use Docker" -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL encontrado" -ForegroundColor Green
}

# 3. Verificar Redis
Write-Host "📦 Verificando Redis..." -ForegroundColor Yellow
if (-not (Get-Command redis-cli -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Redis não encontrado. Instale Redis ou use Docker" -ForegroundColor Yellow
} else {
    Write-Host "✅ Redis encontrado" -ForegroundColor Green
}

# 4. Instalar dependências
Write-Host "📦 Instalando dependências npm..." -ForegroundColor Yellow
npm install

# 5. Copiar .env.example para .env se não existir
if (-not (Test-Path .env)) {
    Write-Host "📝 Criando arquivo .env a partir de .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais!" -ForegroundColor Yellow
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

# 6. Gerar NEXTAUTH_SECRET se não existir
$envContent = Get-Content .env -Raw
if ($envContent -notmatch 'NEXTAUTH_SECRET="[^"]+"' -or $envContent -match 'NEXTAUTH_SECRET=""') {
    Write-Host "🔐 Gerando NEXTAUTH_SECRET..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    (Get-Content .env) -replace 'NEXTAUTH_SECRET=""', "NEXTAUTH_SECRET=`"$secret`"" | Set-Content .env
    Write-Host "✅ NEXTAUTH_SECRET gerado" -ForegroundColor Green
}

# 7. Gerar ENCRYPTION_KEY se não existir
$envContent = Get-Content .env -Raw
if ($envContent -notmatch 'ENCRYPTION_KEY="[^"]+"' -or $envContent -match 'ENCRYPTION_KEY=""') {
    Write-Host "🔐 Gerando ENCRYPTION_KEY..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $key = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
    (Get-Content .env) -replace 'ENCRYPTION_KEY=""', "ENCRYPTION_KEY=`"$key`"" | Set-Content .env
    Write-Host "✅ ENCRYPTION_KEY gerado" -ForegroundColor Green
}

# 8. Gerar Prisma Client
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Yellow
npm run db:generate

# 9. Aplicar migrações do banco
Write-Host "🗄️  Aplicando migrações do banco..." -ForegroundColor Yellow
Write-Host "⚠️  Certifique-se de que o PostgreSQL está rodando e DATABASE_URL está correto no .env" -ForegroundColor Yellow
$response = Read-Host "Deseja aplicar as migrações agora? (s/n)"
if ($response -eq 's' -or $response -eq 'S' -or $response -eq 'y' -or $response -eq 'Y') {
    npm run db:push
    Write-Host "✅ Migrações aplicadas" -ForegroundColor Green
} else {
    Write-Host "⏭️  Pulando migrações. Execute depois: npm run db:push" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env com suas credenciais"
Write-Host "2. Configure suas APIs OAuth (YouTube, Facebook, etc.)"
Write-Host "3. Configure Redis e PostgreSQL"
Write-Host "4. Execute: npm run dev"
Write-Host "5. Em outro terminal, execute: npx tsx scripts/start-worker.ts"


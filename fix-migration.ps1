# Script para corrigir problema de migracao
# Execute: .\fix-migration.ps1

Write-Host "Corrigindo problema de migracao..." -ForegroundColor Cyan

# Verificar se esta no diretorio correto
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "ERRO: Arquivo prisma\schema.prisma nao encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar no diretorio do projeto." -ForegroundColor Yellow
    exit 1
}

Write-Host "Schema encontrado" -ForegroundColor Green

# Remover migracoes antigas
if (Test-Path "prisma\migrations") {
    Write-Host "Removendo migracoes antigas..." -ForegroundColor Yellow
    Remove-Item -Path "prisma\migrations" -Recurse -Force
    Write-Host "Migracoes antigas removidas" -ForegroundColor Green
} else {
    Write-Host "Nenhuma migracao antiga encontrada" -ForegroundColor Blue
}

# Criar migracao inicial
Write-Host "Criando migracao inicial..." -ForegroundColor Cyan
Write-Host "Usando 'db push' (nao requer shadow database)..." -ForegroundColor Yellow
npx prisma db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "Schema sincronizado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Execute no banco (via DBeaver):" -ForegroundColor Yellow
    Write-Host "      CREATE INDEX IF NOT EXISTS embeddings_embedding_idx" -ForegroundColor Gray
    Write-Host "      ON embeddings USING ivfflat (embedding vector_l2_ops)" -ForegroundColor Gray
    Write-Host "      WITH (lists = 100);" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Teste as conexoes:" -ForegroundColor Yellow
    Write-Host "      npm run test:connections" -ForegroundColor Gray
} else {
    Write-Host "ERRO ao criar migracao. Verifique os erros acima." -ForegroundColor Red
    exit 1
}


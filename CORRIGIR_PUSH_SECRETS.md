# 🔒 Como Corrigir o Push Bloqueado por Secrets

## ❌ Problema
O GitHub bloqueou o push porque o arquivo `.env` foi commitado com secrets do Google OAuth.

## ✅ Solução

### Passo 1: Remover o `.env` do commit anterior

Execute estes comandos no PowerShell:

```powershell
# 1. Remover o .env do staging (mas manter o arquivo local)
git rm --cached .env

# 2. Adicionar o .gitignore atualizado
git add .gitignore

# 3. Fazer um novo commit removendo o .env
git commit --amend --no-edit

# 4. OU fazer um novo commit explicando a correção
git commit -m "fix: remove .env from repository, add to .gitignore"
```

### Passo 2: Forçar o push (se necessário)

⚠️ **ATENÇÃO:** Só faça isso se você tem certeza que quer reescrever o histórico.

```powershell
# Forçar push (reescreve o commit anterior)
git push --force
```

**OU** se você quer manter o histórico e adicionar um novo commit:

```powershell
# Push normal (adiciona novo commit)
git push
```

### Passo 3: Verificar se funcionou

```powershell
git status
# O .env não deve aparecer mais
```

## 🔧 Correção do Erro 500 no Onboarding

O erro ocorre porque o campo `onboardingCompleted` pode não existir para usuários antigos. Vou corrigir o endpoint para lidar com isso.


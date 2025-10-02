# 🔐 Configuração de Secrets para Railway

Este guia explica como configurar os secrets necessários no GitHub Actions para deploy automático no Railway.

---

## 📋 Pré-requisitos

1. **Railway CLI** instalado:
```bash
npm install -g @railway/cli
railway login
```

2. **Projeto Railway** criado com os 3 serviços:
   - `auzap-backend-api`
   - `auzap-workers`
   - `auzap-frontend`

3. **Acesso ao repositório GitHub** com permissões de admin

---

## 🎯 Secrets Necessários

### 1. RAILWAY_TOKEN

**O que é**: Token de autenticação do Railway CLI para CI/CD

**Como obter**:
```bash
railway login
# Após fazer login, o token fica em ~/.railway/config.json
cat ~/.railway/config.json
```

Ou crie um Project Token:
1. Acesse: https://railway.app/account/tokens
2. Clique em **"Create Token"**
3. Nome: `GitHub Actions CI/CD`
4. Copie o token gerado

**Adicionar ao GitHub**:
```bash
gh secret set RAILWAY_TOKEN
# Cole o token quando solicitado
```

---

### 2. RAILWAY_PROJECT_ID

**O que é**: ID do projeto Railway

**Como obter**:
```bash
cd /Users/saraiva/final_auzap
railway status
# Ou via dashboard: URL contém o Project ID
# Exemplo: https://railway.app/project/abc123-def456-...
```

**Formato**: `abc123-def456-ghi789-...` (UUID)

**Adicionar ao GitHub**:
```bash
gh secret set RAILWAY_PROJECT_ID
# Cole o Project ID
```

---

### 3. RAILWAY_SERVICE_API

**O que é**: ID do serviço Backend API

**Como obter**:
```bash
railway status --service auzap-backend-api
# Ou via GraphQL API
```

**Via Dashboard**:
1. Acesse projeto no Railway
2. Clique no serviço `auzap-backend-api`
3. Settings → Service ID

**Adicionar ao GitHub**:
```bash
gh secret set RAILWAY_SERVICE_API
```

---

### 4. RAILWAY_SERVICE_WORKERS

**O que é**: ID do serviço Workers

**Como obter**: Mesmo processo do `RAILWAY_SERVICE_API`, mas para o serviço `auzap-workers`

**Adicionar ao GitHub**:
```bash
gh secret set RAILWAY_SERVICE_WORKERS
```

---

### 5. RAILWAY_SERVICE_FRONTEND

**O que é**: ID do serviço Frontend

**Como obter**: Mesmo processo, serviço `auzap-frontend`

**Adicionar ao GitHub**:
```bash
gh secret set RAILWAY_SERVICE_FRONTEND
```

---

### 6. RAILWAY_API_URL

**O que é**: URL pública do backend API

**Como obter**:
```bash
railway domain --service auzap-backend-api
```

Ou via Dashboard:
1. Clique no serviço `auzap-backend-api`
2. Settings → Networking → Domains
3. Copie a URL (ex: `https://auzap-backend-api-production.up.railway.app`)

**Adicionar ao GitHub**:
```bash
gh secret set RAILWAY_API_URL
# Exemplo: https://auzap-backend-api-production.up.railway.app
```

---

### 7. RAILWAY_FRONTEND_URL

**O que é**: URL pública do frontend

**Como obter**: Mesmo processo do `RAILWAY_API_URL`, mas para `auzap-frontend`

**Adicionar ao GitHub**:
```bash
gh secret set RAILWAY_FRONTEND_URL
# Exemplo: https://auzap-frontend-production.up.railway.app
```

---

## 🤖 Script Automatizado

Use este script para configurar todos os secrets de uma vez:

```bash
#!/bin/bash
# setup-railway-secrets.sh

set -e

echo "🔐 Railway Secrets Setup for GitHub Actions"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install: brew install gh"
    exit 1
fi

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install: npm install -g @railway/cli"
    exit 1
fi

# Set secret helper
set_secret() {
    local name=$1
    local value=$2
    echo "$value" | gh secret set "$name" 2>/dev/null
    echo "✅ $name configured"
}

echo "📝 Please provide the following information:"
echo ""

# 1. Railway Token
read -sp "RAILWAY_TOKEN (from railway login or account tokens): " RAILWAY_TOKEN
echo ""
set_secret "RAILWAY_TOKEN" "$RAILWAY_TOKEN"

# 2. Project ID
read -p "RAILWAY_PROJECT_ID (from railway status): " RAILWAY_PROJECT_ID
set_secret "RAILWAY_PROJECT_ID" "$RAILWAY_PROJECT_ID"

# 3. Service IDs
echo ""
echo "Service IDs (from Railway Dashboard → Service → Settings):"
read -p "RAILWAY_SERVICE_API (backend): " RAILWAY_SERVICE_API
set_secret "RAILWAY_SERVICE_API" "$RAILWAY_SERVICE_API"

read -p "RAILWAY_SERVICE_WORKERS: " RAILWAY_SERVICE_WORKERS
set_secret "RAILWAY_SERVICE_WORKERS" "$RAILWAY_SERVICE_WORKERS"

read -p "RAILWAY_SERVICE_FRONTEND: " RAILWAY_SERVICE_FRONTEND
set_secret "RAILWAY_SERVICE_FRONTEND" "$RAILWAY_SERVICE_FRONTEND"

# 4. URLs
echo ""
echo "Public URLs (from Railway Dashboard → Service → Settings → Networking):"
read -p "RAILWAY_API_URL (https://...): " RAILWAY_API_URL
set_secret "RAILWAY_API_URL" "$RAILWAY_API_URL"

read -p "RAILWAY_FRONTEND_URL (https://...): " RAILWAY_FRONTEND_URL
set_secret "RAILWAY_FRONTEND_URL" "$RAILWAY_FRONTEND_URL"

echo ""
echo "✅ All secrets configured successfully!"
echo ""
echo "🧪 Test the workflow:"
echo "gh workflow run cd-railway.yml"
```

**Uso**:
```bash
chmod +x .github/scripts/setup-railway-secrets.sh
./.github/scripts/setup-railway-secrets.sh
```

---

## 🧪 Validação

### Verificar Secrets Configurados

```bash
gh secret list
```

**Esperado**:
```
RAILWAY_TOKEN
RAILWAY_PROJECT_ID
RAILWAY_SERVICE_API
RAILWAY_SERVICE_WORKERS
RAILWAY_SERVICE_FRONTEND
RAILWAY_API_URL
RAILWAY_FRONTEND_URL
```

### Testar Workflow Manualmente

```bash
gh workflow run cd-railway.yml
```

Ou via interface:
1. GitHub → Actions → "CD - Deploy to Railway"
2. Run workflow → Branch: main → Run

---

## 🔄 Railway Auto-Deploy

Railway faz deploy automático quando conectado ao GitHub. O workflow do GitHub Actions serve para:

1. **Validação adicional** antes do deploy
2. **Health checks** pós-deploy
3. **Notificações** de status
4. **Deploy seletivo** (só API, só Frontend, etc.)

### Desabilitar Auto-Deploy (Opcional)

Se preferir controle total via GitHub Actions:

1. Railway Dashboard → Service → Settings
2. **GitHub Repo** → Desmarcar "Auto Deploy"
3. Deploy acontecerá apenas via `railway up` no workflow

---

## 🐛 Troubleshooting

### "railway: command not found"

```bash
npm install -g @railway/cli
railway --version
```

### "Not authenticated"

```bash
railway login
# Ou use RAILWAY_TOKEN no CI
```

### "Project not found"

Verifique o `RAILWAY_PROJECT_ID`:
```bash
railway status
```

### Secret não aparece no workflow

1. Verifique o nome do secret (case-sensitive)
2. Secrets só aparecem em workflows após serem configurados
3. Re-execute o workflow após adicionar secrets

---

## 📚 Referências

- **Railway CLI Docs**: https://docs.railway.app/develop/cli
- **Railway Tokens**: https://railway.app/account/tokens
- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Railway GraphQL API**: https://docs.railway.app/reference/public-api

---

## ✅ Checklist

- [ ] Railway CLI instalado
- [ ] GitHub CLI instalado (`gh`)
- [ ] Railway Token obtido
- [ ] Project ID copiado
- [ ] 3 Service IDs copiados (API, Workers, Frontend)
- [ ] 2 URLs públicas copiadas (API, Frontend)
- [ ] Todos os 7 secrets configurados no GitHub
- [ ] Secrets validados com `gh secret list`
- [ ] Workflow testado com `gh workflow run cd-railway.yml`

---

**Setup completo! 🎉**

Agora seu repositório está pronto para deploy automático no Railway.

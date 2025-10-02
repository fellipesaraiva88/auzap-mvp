# 🚂 Status do Deploy - AuZap MVP (Railway)

**ÚLTIMA ATUALIZAÇÃO**: 02/10/2025 14:30 UTC
**PLATAFORMA**: Railway.app
**STATUS**: Configuração Completa - Pronto para Deploy

---

## 📦 SERVIÇOS CONFIGURADOS

### Backend API - `auzap-backend-api`
- **Plataforma**: Railway
- **Runtime**: Node.js 20.x
- **Build**: `npm ci && npm run build`
- **Start**: `node dist/server.js`
- **Health Check**: `/health`
- **Config**: ✅ `backend/railway.json` + `backend/nixpacks.toml`

### Workers - `auzap-workers`
- **Plataforma**: Railway
- **Runtime**: Node.js 20.x
- **Build**: `npm ci && npm run build`
- **Start**: `node dist/workers/index.js`
- **Config**: ✅ Usa mesma config do backend

### Frontend - `auzap-frontend`
- **Plataforma**: Railway
- **Runtime**: Node.js 20.x + serve
- **Build**: `npm ci && npm run build`
- **Start**: `npm start` → `serve dist -s -p $PORT`
- **Config**: ✅ `frontend/railway.json` + `frontend/nixpacks.toml`

---

## ✅ ARQUIVOS CRIADOS

### Configurações Railway
- ✅ `backend/railway.json` - Config backend/workers
- ✅ `backend/nixpacks.toml` - Build config backend
- ✅ `frontend/railway.json` - Config frontend
- ✅ `frontend/nixpacks.toml` - Build config frontend

### CI/CD
- ✅ `.github/workflows/cd-railway.yml` - Deploy automático
- ✅ `.github/RAILWAY_SECRETS.md` - Guia de secrets
- ✅ `.github/scripts/setup-railway-secrets.sh` - Script automático

### Documentação
- ✅ `RAILWAY_DEPLOY.md` - Guia completo de deploy
- ✅ `DEPLOY_STATUS.md` - Este arquivo

### Package Updates
- ✅ `frontend/package.json` - Adicionado `serve` e script `start`

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Backend (11 variáveis)
```bash
# Supabase
SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
SUPABASE_ANON_KEY=[REDACTED_SUPABASE_KEY]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SUPABASE_KEY]

# OpenAI
OPENAI_API_KEY=[REDACTED_OPENAI_KEY]

# Redis (Upstash Production)
UPSTASH_REDIS_REST_URL=https://prime-mullet-17029.upstash.io
UPSTASH_REDIS_REST_TOKEN=[REDACTED_UPSTASH_TOKEN]...
REDIS_URL=redis://default:[REDACTED_UPSTASH_TOKEN]...@prime-mullet-17029.upstash.io:6379

# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=${RAILWAY_STATIC_URL}
BAILEYS_SESSION_PATH=/app/sessions
LOG_LEVEL=info
```

### Frontend (3 variáveis)
```bash
VITE_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
VITE_SUPABASE_ANON_KEY=[REDACTED_SUPABASE_KEY]
VITE_API_URL=https://auzap-backend-api-production.up.railway.app
```

---

## 📋 PRÓXIMOS PASSOS

### 1. Criar Projeto no Railway
```bash
# Via CLI
railway login
railway init

# Ou via UI
# 1. Acesse https://railway.app/new
# 2. "Deploy from GitHub repo"
# 3. Selecione: final_auzap
```

### 2. Criar Serviços

#### Backend API
- **Name**: `auzap-backend-api`
- **Root Directory**: `/backend`
- **Build Command**: Auto-detect (railway.json)
- **Start Command**: Auto-detect (railway.json)
- **Environment**: Cole variáveis do backend/.env

#### Workers (Opcional)
- **Name**: `auzap-workers`
- **Root Directory**: `/backend`
- **Start Command**: `node dist/workers/index.js`
- **Environment**: Mesmas do backend

#### Frontend
- **Name**: `auzap-frontend`
- **Root Directory**: `/frontend`
- **Build Command**: Auto-detect (railway.json)
- **Start Command**: Auto-detect (railway.json)
- **Environment**: Cole variáveis (3 vars acima)

### 3. Gerar Domínios
- Backend: Settings → Networking → Generate Domain
- Frontend: Settings → Networking → Generate Domain
- **Importante**: Atualize `VITE_API_URL` no frontend com URL do backend

### 4. Configurar GitHub Secrets
```bash
# Automatizado
./.github/scripts/setup-railway-secrets.sh

# Ou manual (7 secrets):
gh secret set RAILWAY_TOKEN
gh secret set RAILWAY_PROJECT_ID
gh secret set RAILWAY_SERVICE_API
gh secret set RAILWAY_SERVICE_WORKERS
gh secret set RAILWAY_SERVICE_FRONTEND
gh secret set RAILWAY_API_URL
gh secret set RAILWAY_FRONTEND_URL
```

### 5. Push e Deploy
```bash
git add .
git commit -m "feat: Configure Railway deployment"
git push origin main

# Railway fará deploy automático!
```

---

## 🧪 VALIDAÇÃO

### Health Checks
```bash
# Backend API
curl https://auzap-backend-api-production.up.railway.app/health

# Frontend
curl https://auzap-frontend-production.up.railway.app
```

### Logs
```bash
# Via CLI
railway logs --service auzap-backend-api

# Ou via Dashboard
# Railway → Project → Service → Deployments → View Logs
```

---

## 🔄 CI/CD WORKFLOW

### Trigger Automático
- Push para `main` → Deploy automático de todos os serviços

### Trigger Manual
```bash
# Via GitHub CLI
gh workflow run cd-railway.yml

# Ou via UI
# GitHub → Actions → "CD - Deploy to Railway" → Run workflow
```

### Deploy Seletivo
```bash
gh workflow run cd-railway.yml -f service=api
gh workflow run cd-railway.yml -f service=frontend
gh workflow run cd-railway.yml -f service=workers
```

---

## 📊 MONITORAMENTO

### Métricas Railway
- **CPU**: Railway Dashboard → Service → Metrics
- **Memory**: Railway Dashboard → Service → Metrics
- **Logs**: Railway Dashboard → Service → Deployments

### Alertas
- Settings → Webhooks → Add Endpoint
- Tipos: `DEPLOY_SUCCESS`, `DEPLOY_FAILURE`, `CRASH`

---

## 💰 CUSTOS ESTIMADOS

| Serviço | vCPU | RAM | Custo/mês |
|---------|------|-----|-----------|
| Backend API | 1 | 1GB | $5-10 |
| Workers | 0.5 | 512MB | $3-5 |
| Frontend | 0.25 | 256MB | $2-3 |
| **TOTAL** | - | - | **$10-18** |

**Créditos**: Railway oferece $5/mês grátis.

---

## 🐛 TROUBLESHOOTING

### Build Falha
1. Verificar logs: `railway logs`
2. Verificar `package-lock.json` atualizado
3. Verificar Node version (20.x)

### Backend Não Responde
1. Verificar health endpoint
2. Aumentar timeout (Settings → Deploy)
3. Verificar `PORT` env var

### Frontend CORS Error
```typescript
// backend/src/server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- 📖 [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Guia passo a passo
- 🔐 [.github/RAILWAY_SECRETS.md](./.github/RAILWAY_SECRETS.md) - Config secrets
- 🤖 [.github/workflows/cd-railway.yml](./.github/workflows/cd-railway.yml) - CI/CD

---

## ✅ CHECKLIST PRÉ-DEPLOY

- [x] Arquivos de configuração criados
- [x] CI/CD workflow configurado
- [x] Documentação completa
- [x] Package.json atualizado
- [x] Scripts de setup criados
- [ ] Projeto Railway criado
- [ ] Serviços Railway configurados
- [ ] Variáveis de ambiente adicionadas
- [ ] Domínios gerados
- [ ] GitHub Secrets configurados
- [ ] Primeiro deploy executado
- [ ] Health checks validados

---

**Status**: ✅ Configuração Completa - Pronto para Deploy
**Próximo Passo**: Criar projeto no Railway e executar deploy

🚂 **Railway Deploy Ready!**

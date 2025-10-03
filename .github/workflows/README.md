# 🚀 AuZap CI/CD Workflows

## 📋 Visão Geral

Sistema completo de CI/CD com **7 workflows** robustos para garantir qualidade máxima em todas as etapas do desenvolvimento.

## 🏗️ Arquitetura de Workflows

```
┌─────────────────────────────────────────────────────────┐
│                    PR Validation                         │
│  ├─ Frontend Validation                                 │
│  ├─ Backend Validation                                  │
│  ├─ Security Scan                                       │
│  ├─ Critical E2E Tests                                  │
│  └─ Code Quality Metrics                                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Merge to develop (Auto)                     │
│                 Deploy Staging                           │
│  ├─ Run All Validations                                 │
│  ├─ Build & Deploy Frontend                             │
│  ├─ Build & Deploy Backend                              │
│  ├─ Health Checks (3 endpoints)                         │
│  └─ Smoke Tests                                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Tag v*.*.* (Manual Approval)                   │
│                Deploy Production                         │
│  ├─ Validate Semantic Version                           │
│  ├─ Backup Database (Supabase)                          │
│  ├─ Full Validation Suite                               │
│  ├─ Complete Security Scan                              │
│  ├─ Build & Deploy (Frontend + Backend)                 │
│  ├─ Health Checks (5 endpoints)                         │
│  ├─ Production Smoke Tests                              │
│  ├─ Create GitHub Release                               │
│  └─ Rollback on Failure                                 │
└─────────────────────────────────────────────────────────┘
```

## 📁 Workflows Disponíveis

### 1️⃣ `validate-frontend.yml` - Frontend Validation
**Trigger:** Push/PR em `main` ou `develop` (paths: `src/**`, `package.json`)

**Executa:**
- ✅ TypeScript type-check (`npm run type-check`)
- ✅ ESLint validation (max 155 warnings)
- ✅ Build production (`npm run build`)
- ✅ Build development (`npm run build:dev`)

**Matrix:** Node.js 18 e 20

**Artifacts:** `frontend-dist` (7 dias)

---

### 2️⃣ `validate-backend.yml` - Backend Validation
**Trigger:** Push/PR em `main` ou `develop` (paths: `backend/**`)

**Executa:**
- ✅ TypeScript compilation check (`npm run build`)
- ✅ ESLint validation (`npm run lint`)
- ✅ Unit tests (`npm test`)
- ✅ Queue smoke tests (`npm run queues:test`)

**Services:** Redis 7-alpine (para BullMQ tests)

**Matrix:** Node.js 18 e 20

**Artifacts:** `backend-dist` (7 dias)

---

### 3️⃣ `security.yml` - Security Scanning
**Trigger:**
- Push/PR em `main` ou `develop`
- Schedule (diário às 2 AM UTC)

**Jobs:**
1. **Secret Scanning** - TruffleHog (only-verified)
2. **Dependency Security** - npm audit (frontend + backend)
3. **SAST Analysis** - Semgrep (security-audit, typescript, nodejs, react, owasp)
4. **License Compliance** - license-checker
5. **Docker Security** - Trivy image scan

**Artifacts:** `security-report` (resumo completo)

---

### 4️⃣ `e2e-tests.yml` - E2E Tests (Playwright)
**Trigger:** Push/PR em `main` ou `develop` + manual

**Executa:**
- 🎭 Playwright tests em **3 browsers** (chromium, firefox, webkit)
- 🧩 **Sharding** (2 shards por browser = 6 jobs paralelos)
- 📸 Screenshots on failure
- 🎥 Video recording on failure

**Artifacts:**
- `playwright-results-{browser}-shard-{N}` (7 dias)
- `playwright-screenshots` (on failure)
- `playwright-videos` (on failure)
- `playwright-report-merged` (30 dias)

---

### 5️⃣ `deploy-staging.yml` - Deploy Staging
**Trigger:** Push em `develop` + manual

**Pipeline:**
1. ✅ Run Frontend Validation
2. ✅ Run Backend Validation
3. ✅ Run Security Scan
4. 🚀 Deploy Frontend (Render)
5. 🚀 Deploy Backend (Render)
6. ⏳ Wait 2 minutos
7. 🏥 Health Checks (backend + frontend)
8. 🧪 Smoke Tests (3 endpoints: `/health`, `/health/redis`, `/health/supabase`)

**Environment:** `staging`

**URLs:**
- Frontend: `https://auzap-frontend-staging.onrender.com`
- Backend: `https://auzap-backend-staging.onrender.com`

---

### 6️⃣ `deploy-production.yml` - Deploy Production
**Trigger:** Tags `v*.*.*` + manual (com approval)

**Pipeline:**
1. 🏷️ Validate Semantic Version
2. 💾 Backup Database (Supabase)
3. ✅ Full Validation Suite (frontend + backend + tests)
4. 🔒 Complete Security Scan
5. 🚀 Deploy Frontend (clear cache)
6. 🚀 Deploy Backend (clear cache)
7. ⏳ Wait 3 minutos
8. 🏥 Health Checks com retry (5 endpoints, 10 tentativas)
9. 🧪 Production Smoke Tests
10. 📦 Create GitHub Release (com changelog)
11. 🔄 Rollback on Failure

**Environment:** `production`

**URLs:**
- Frontend: `https://auzap-frontend-d84c.onrender.com`
- Backend: `https://auzap-backend-8xyx.onrender.com`

**Semantic Versioning:** Tag deve ser `v{major}.{minor}.{patch}`

---

### 7️⃣ `pr-validation.yml` - Pull Request Validation
**Trigger:** PR aberto/atualizado em `main` ou `develop`

**Executa:**
- ✅ Frontend Validation
- ✅ Backend Validation
- 🔒 Security Scan
- 🎭 Critical E2E Tests (só @critical tag, chromium)
- 📊 Code Quality Metrics (bundle size, LOC)

**Features:**
- 📝 **Auto-comment** no PR com tabela de resultados
- 🚦 **Status check** consolidado
- 📊 **Metrics artifacts**

---

## 🔐 Secrets Necessários

Configure no GitHub Secrets (Settings → Secrets and variables → Actions):

```bash
# Supabase
VITE_SUPABASE_PUBLISHABLE_KEY  # Frontend anon key
SUPABASE_URL                    # Supabase project URL
SUPABASE_ANON_KEY              # Backend anon key
SUPABASE_SERVICE_KEY           # Backend admin key

# OpenAI (para testes de AI)
OPENAI_API_KEY

# Redis (para testes de queue)
REDIS_URL

# Render Deploy
RENDER_API_KEY
RENDER_SERVICE_ID_FRONTEND           # Production frontend
RENDER_SERVICE_ID_BACKEND            # Production backend
RENDER_SERVICE_ID_FRONTEND_STAGING   # Staging frontend
RENDER_SERVICE_ID_BACKEND_STAGING    # Staging backend

# GitHub (auto-gerado)
GITHUB_TOKEN  # Criação de releases
```

---

## 🚦 Validações por Ambiente

| Validação | PR | Staging | Production |
|-----------|:--:|:-------:|:----------:|
| **Frontend TypeCheck** | ✅ | ✅ | ✅ |
| **Frontend Lint** | ✅ | ✅ | ✅ |
| **Frontend Build** | ✅ | ✅ | ✅ |
| **Backend TypeCheck** | ✅ | ✅ | ✅ |
| **Backend Lint** | ✅ | ✅ | ✅ |
| **Backend Build** | ✅ | ✅ | ✅ |
| **Backend Tests** | ✅ | ✅ | ✅ |
| **Queue Tests** | ✅ | ✅ | ✅ |
| **Secret Scan** | ✅ | ✅ | ✅ |
| **Dependency Audit** | ✅ | ✅ | ✅ |
| **SAST Scan** | ✅ | ✅ | ✅ |
| **E2E Tests (Critical)** | ✅ | ❌ | ❌ |
| **E2E Tests (Full)** | ❌ | ✅ | ✅ |
| **Database Backup** | ❌ | ❌ | ✅ |
| **Health Checks** | ❌ | ✅ | ✅ |
| **Smoke Tests** | ❌ | ✅ | ✅ |
| **GitHub Release** | ❌ | ❌ | ✅ |

---

## 📝 Workflows de Exemplo

### Deploy para Staging
```bash
# Automatically triggered
git checkout develop
git pull origin develop
git merge feature/my-feature
git push origin develop
# Workflow starts automatically
```

### Deploy para Production
```bash
# Manual process
git checkout main
git pull origin main
git merge develop

# Create semantic version tag
git tag -a v1.2.3 -m "Release v1.2.3: Add new features"
git push origin v1.2.3

# Workflow starts, requires manual approval in GitHub
```

### Validar PR Localmente
```bash
# Frontend
npm run type-check
npm run lint
npm run build

# Backend
cd backend
npm run build
npm run lint
npm test
npm run queues:test

# E2E
npm run test:e2e
```

---

## 🎯 Matrix Strategy

**Frontend & Backend Validation:**
- Node.js 18 ✅
- Node.js 20 ✅

**E2E Tests:**
- Chromium Shard 1 ✅
- Chromium Shard 2 ✅
- Firefox Shard 1 ✅
- Firefox Shard 2 ✅
- Webkit Shard 1 ✅
- Webkit Shard 2 ✅

Total: **6 jobs paralelos** para E2E

---

## 🔧 Troubleshooting

### Workflow falhou no TypeCheck
```bash
# Rodar localmente
npm run type-check

# Ou no backend
cd backend && npm run build
```

### Workflow falhou no Lint
```bash
# Auto-fix
npm run lint -- --fix
cd backend && npm run lint -- --fix
```

### Workflow falhou nos testes
```bash
cd backend
npm test

# Rodar smoke tests de queue
npm run queues:test
```

### Deploy falhou no health check
- Verificar logs no Render Dashboard
- Testar endpoints manualmente:
  ```bash
  curl https://auzap-backend-8xyx.onrender.com/health
  curl https://auzap-backend-8xyx.onrender.com/health/redis
  curl https://auzap-backend-8xyx.onrender.com/health/supabase
  ```

### Secret scanning detectou falso positivo
- Adicionar ao `.gitignore`
- Commitar em branch separado
- Re-rodar workflow

---

## 🎓 Melhores Práticas

1. **Sempre crie PRs** - Não faça push direto em `main` ou `develop`
2. **Aguarde validações** - Só merge após todos os checks passarem
3. **Use tags semânticas** - `v{major}.{minor}.{patch}`
4. **Revise security reports** - Artifacts gerados diariamente
5. **Monitore health checks** - Failures indicam problemas de infra
6. **Teste localmente** - Rode validações antes de push

---

## 📊 Métricas e Monitoramento

**Artifacts Gerados:**
- `frontend-dist` - Build do frontend (7 dias)
- `backend-dist` - Build do backend (7 dias)
- `security-report` - Relatório de segurança (permanente)
- `playwright-report-merged` - Relatório E2E consolidado (30 dias)
- `code-metrics` - Métricas de qualidade (7 dias)

**Tempo Estimado:**
- PR Validation: ~10-15 min
- Deploy Staging: ~15-20 min
- Deploy Production: ~25-30 min
- E2E Tests (Full): ~20-25 min

---

## 🚀 Multi-Instância Claude Code

**Seguro para trabalho paralelo:**
- ✅ Validações automáticas em cada push
- ✅ Conflicts detectados no PR validation
- ✅ Rollback automático em falhas
- ✅ Health checks garantem estabilidade

**Workflow Recomendado:**
1. Cada Claude instance trabalha em branch separado
2. PR validation garante qualidade antes de merge
3. Staging deploy testa integração
4. Production deploy com approval manual

---

🤖 **Workflows criados com [Claude Code](https://claude.com/claude-code)**

*Última atualização: Outubro 2025*

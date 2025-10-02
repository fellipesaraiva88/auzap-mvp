# 🚀 CI/CD Pipeline - AuZap

Pipeline de CI/CD automatizado usando GitHub Actions e Render.

## 📊 Status

![CI](https://github.com/fellipesaraiva88/auzap-mvp/workflows/CI%20-%20Tests%20%26%20Build/badge.svg)
![CD](https://github.com/fellipesaraiva88/auzap-mvp/workflows/CD%20-%20Deploy%20to%20Render/badge.svg)

## 🎯 Quick Start

### 1. Configurar Secrets (apenas uma vez)

```bash
# Usando script auxiliar
./.github/scripts/setup-render-secrets.sh

# Ou manualmente via GitHub UI
# Veja: .github/CICD_SETUP.md
```

### 2. Workflow Normal

```bash
# 1. Criar branch
git checkout -b feat/minha-feature

# 2. Fazer alterações
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 3. Push e criar PR
git push origin feat/minha-feature

# 4. CI roda automaticamente no PR
# 5. Merge para main → CD roda automaticamente
```

## 📋 Workflows

### ✅ CI - Tests & Build
- **Quando**: PRs e pushes para main/develop
- **O que faz**:
  - Lint backend + frontend
  - Build TypeScript
  - Testes E2E (8 testes)
  - Coverage report
  - Valida render.yaml

### 🚀 CD - Deploy to Render
- **Quando**: Push para main (automático)
- **O que faz**:
  1. Deploy API
  2. Deploy Workers
  3. Deploy Frontend
  4. Health checks
  5. Summary report

### 🔍 PR Checks
- **Quando**: Pull Requests
- **O que faz**:
  - Valida título (conventional commits)
  - Check tamanho de arquivos
  - Scan de secrets (TruffleHog)
  - Security audit (npm audit)
  - Detecta TODO/FIXME

## 🔐 Secrets Necessários

### Supabase
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database & Cache
- `DATABASE_URL`
- `REDIS_URL`

### APIs
- `OPENAI_API_KEY`
- `WHATSAPP_WEBHOOK_SECRET`

### Render
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID_API`
- `RENDER_SERVICE_ID_WORKERS`
- `RENDER_SERVICE_ID_FRONTEND`
- `RENDER_API_URL`
- `RENDER_FRONTEND_URL`

## 🎮 Comandos Úteis

### Deploy Manual
```bash
# Via GitHub UI
Actions → CD - Deploy to Render → Run workflow

# Escolher: all | api | workers | frontend
```

### Verificar Status
```bash
# Listar secrets
gh secret list

# Ver último deploy
gh run list --workflow=cd-render.yml --limit 1

# Logs do último run
gh run view --log
```

### Rollback
```bash
# Opção 1: Via Render Dashboard
Dashboard → Service → Deploys → Redeploy versão anterior

# Opção 2: Via Git
git revert [commit-hash]
git push origin main
```

## 📈 Métricas

- **Build Time**: ~3-5 min (backend + frontend)
- **Test Time**: ~15s (E2E)
- **Deploy Time**: ~5-10 min por serviço
- **Total Pipeline**: ~15-20 min

## 🔧 Troubleshooting

### CI Falhando
```bash
# Rodar localmente
cd backend
npm run lint
npm run build
npm run test tests/e2e-simplified.test.ts
```

### CD Falhando
```bash
# Check logs no Render
Dashboard → Service → Logs

# Testar health
curl https://auzap-api.onrender.com/health
```

### Secrets Inválidos
```bash
# Re-configurar secrets
./.github/scripts/setup-render-secrets.sh
```

## 📚 Documentação Completa

Para setup detalhado, veja: [`.github/CICD_SETUP.md`](.github/CICD_SETUP.md)

## ✅ Checklist de Setup

- [ ] Todos os secrets configurados no GitHub
- [ ] Render API Key gerada
- [ ] Service IDs copiados
- [ ] Auto-deploy desabilitado no Render
- [ ] Health endpoints funcionando (`/health`)
- [ ] Primeiro deploy manual testado
- [ ] CI testado com PR
- [ ] CD testado com merge para main

---

**🎉 Pipeline Pronto!** Push para main = Deploy automático 🚀

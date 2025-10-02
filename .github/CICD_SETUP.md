# CI/CD Setup Guide - AuZap

Este guia explica como configurar o CI/CD completo do projeto AuZap usando GitHub Actions e Render.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração de Secrets no GitHub](#configuração-de-secrets-no-github)
3. [Configuração do Render](#configuração-do-render)
4. [Workflows Disponíveis](#workflows-disponíveis)
5. [Como Usar](#como-usar)
6. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O projeto possui 3 workflows principais:

- **CI (Continuous Integration)**: Testes e build automático em PRs e pushes
- **CD (Continuous Deployment)**: Deploy automático para Render na branch main
- **PR Checks**: Validações adicionais em Pull Requests

## 🔐 Configuração de Secrets no GitHub

### Passo 1: Acessar GitHub Secrets

1. Vá para: `https://github.com/[seu-usuario]/[seu-repo]/settings/secrets/actions`
2. Clique em "New repository secret"

https://github.com/fellipesaraiva88/auzap-mvpsettings/secrets/actions### Passo 2: Adicionar Secrets Obrigatórios

#### **Supabase Credentials**

```
SUPABASE_URL
Valor: https://[seu-projeto].supabase.co

SUPABASE_ANON_KEY
Valor: [REDACTED_SUPABASE_KEY]

SUPABASE_SERVICE_ROLE_KEY
Valor: [REDACTED_SUPABASE_KEY]
```

> 📍 **Onde encontrar**: Supabase Dashboard > Project Settings > API

#### **Database & Redis**

```
DATABASE_URL
Valor: postgresql://postgres:[senha]@[host]:5432/postgres

REDIS_URL
Valor: redis://default:[senha]@[host]:6379
```

> 📍 **Onde encontrar**: Render Dashboard > Redis/PostgreSQL > Connection Info

#### **API Keys**

```
OPENAI_API_KEY
Valor: [REDACTED_OPENAI_KEY]...

WHATSAPP_WEBHOOK_SECRET
Valor: [seu-webhook-secret]
```

#### **Render Configuration**

```
RENDER_API_KEY
Valor: rnd_[sua-api-key]
```

> 📍 **Como obter**:
> 1. Acesse: https://dashboard.render.com/account/api-keys
> 2. Clique em "Create API Key"
> 3. Copie a chave gerada

```
RENDER_SERVICE_ID_API
Valor: srv-[id-do-servico-api]

RENDER_SERVICE_ID_WORKERS
Valor: srv-[id-do-servico-workers]

RENDER_SERVICE_ID_FRONTEND
Valor: srv-[id-do-servico-frontend]
```

> 📍 **Como obter**: Render Dashboard > Service > Settings > Service Details

```
RENDER_API_URL
Valor: https://auzap-api.onrender.com

RENDER_FRONTEND_URL
Valor: https://auzap-frontend.onrender.com
```

## 🚀 Configuração do Render

### 1. Obter Service IDs

Execute este comando para listar seus serviços:

```bash
curl -H "Authorization: Bearer rnd_[sua-api-key]" \
  https://api.render.com/v1/services | jq '.[] | {name, id}'
```

Ou acesse manualmente:
1. Dashboard Render > Service
2. Na URL: `https://dashboard.render.com/web/srv-[ID]`
3. Copie o ID da URL

### 2. Configurar Auto-Deploy

Para cada serviço no Render:

1. Settings > Build & Deploy
2. **Auto-Deploy**: `No` (será controlado pelo GitHub Actions)
3. **Branch**: `main`

### 3. Configurar Environment Variables

Certifique-se de que todas as variáveis de ambiente estão configuradas no Render:

**API Service:**
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- REDIS_URL
- OPENAI_API_KEY
- WHATSAPP_WEBHOOK_SECRET
- PORT=3000
- NODE_ENV=production

**Workers Service:**
- (mesmas do API)

**Frontend Service:**
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## 📊 Workflows Disponíveis

### 1. CI - Tests & Build (`ci.yml`)

**Quando executa:**
- Pull Requests para `main` ou `develop`
- Push para `main` ou `develop`

**O que faz:**
- ✅ Instala dependências (backend + frontend)
- ✅ Executa linter
- ✅ Build TypeScript
- ✅ Executa testes E2E
- ✅ Gera relatório de cobertura
- ✅ Valida render.yaml

### 2. CD - Deploy to Render (`cd-render.yml`)

**Quando executa:**
- Push para `main` (automático)
- Manual dispatch (workflow_dispatch)

**O que faz:**
1. Deploy API
2. Deploy Workers (após API)
3. Deploy Frontend (após API)
4. Health checks
5. Resumo do deployment

**Deploy Manual:**
```bash
# Via GitHub UI:
Actions > CD - Deploy to Render > Run workflow
# Escolher: all, api, workers, ou frontend
```

### 3. PR Checks (`pr-checks.yml`)

**Quando executa:**
- Pull Requests (opened, synchronize, reopened)

**O que faz:**
- ✅ Valida título do PR (conventional commits)
- ✅ Verifica tamanho de arquivos (< 1MB)
- ✅ Scan de secrets com TruffleHog
- ✅ Audit de segurança (npm audit)
- ✅ Detecta TODO/FIXME

## 🎮 Como Usar

### Desenvolvimento Normal

1. **Criar branch de feature:**
```bash
git checkout -b feat/nova-funcionalidade
```

2. **Fazer commits:**
```bash
git add .
git commit -m "feat: adicionar nova funcionalidade"
```

3. **Criar Pull Request:**
- Título deve seguir: `feat:`, `fix:`, `docs:`, etc.
- CI rodará automaticamente
- PR Checks validará tudo

4. **Merge para main:**
- CD rodará automaticamente
- Deploy para Render será feito

### Deploy Manual

Se precisar fazer deploy de um serviço específico:

1. Acesse: `Actions > CD - Deploy to Render`
2. Clique em `Run workflow`
3. Selecione o serviço (all/api/workers/frontend)
4. Clique em `Run workflow`

### Rollback

Se precisar fazer rollback:

1. **Opção 1 - Via Render UI:**
   - Dashboard > Service > Deploys
   - Escolha deploy anterior > Redeploy

2. **Opção 2 - Via Git:**
```bash
git revert [commit-hash]
git push origin main
```

## 🔍 Troubleshooting

### CI Falhando

**Problema: Testes falhando**
```bash
# Rodar testes localmente
cd backend
npm run test tests/e2e-simplified.test.ts
```

**Problema: Build falhando**
```bash
# Verificar build local
cd backend
npm run build
```

### CD Falhando

**Problema: Deploy travado**
- Check: Render Dashboard > Service > Logs
- Timeout padrão: 10 minutos
- Aumentar timeout se necessário (editar workflow)

**Problema: Health check falhando**
```bash
# Testar endpoint manualmente
curl https://auzap-api.onrender.com/health
```

**Problema: Service ID inválido**
```bash
# Listar services
curl -H "Authorization: Bearer rnd_[key]" \
  https://api.render.com/v1/services
```

### PR Checks Falhando

**Problema: Título do PR inválido**
- Formato correto: `tipo: descrição`
- Tipos válidos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Problema: Secrets detectados**
- Remover secrets do código
- Adicionar ao `.gitignore`
- Usar variáveis de ambiente

**Problema: Arquivos grandes**
```bash
# Encontrar arquivos grandes
find . -type f -size +1M -not -path "*/node_modules/*"

# Adicionar ao .gitignore ou usar Git LFS
```

## 📈 Monitoramento

### Logs do CI/CD

1. **GitHub Actions:**
   - Repo > Actions > Escolher workflow
   - Ver logs detalhados de cada step

2. **Render:**
   - Dashboard > Service > Logs
   - Ver logs de runtime e deploy

### Métricas

- **Build Time**: ~3-5 minutos (backend + frontend)
- **Test Time**: ~15 segundos (E2E)
- **Deploy Time**: ~5-10 minutos (por serviço)
- **Total Pipeline**: ~15-20 minutos

## 🔄 Atualizações

### Adicionar novo Secret

1. GitHub > Settings > Secrets > New secret
2. Atualizar workflow se necessário
3. Re-run jobs se necessário

### Modificar Workflow

1. Editar arquivo `.github/workflows/[workflow].yml`
2. Commit e push
3. Workflow atualizado automaticamente

## 📚 Recursos Adicionais

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Render Deploy Docs](https://render.com/docs/deploys)
- [Render API Docs](https://api-docs.render.com/reference/introduction)

## ✅ Checklist de Configuração

- [ ] Todos os secrets do GitHub configurados
- [ ] Render API Key gerada
- [ ] Service IDs copiados
- [ ] Auto-deploy desabilitado no Render
- [ ] Health endpoints funcionando
- [ ] Primeiro deploy manual testado
- [ ] CI rodando em PR de teste
- [ ] CD rodando em merge de teste
- [ ] Logs monitorados

---

**🎉 Setup Completo!** Agora você tem CI/CD totalmente automatizado.

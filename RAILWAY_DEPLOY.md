# 🚂 Deploy AuZap no Railway

**ÚLTIMA ATUALIZAÇÃO**: 02/10/2025

## 📋 Pré-requisitos

1. **Conta Railway**: https://railway.app (Login com GitHub)
2. **Railway CLI** (opcional, mas recomendado):
```bash
npm install -g @railway/cli
railway login
```

3. **Repositório GitHub** conectado ao Railway

---

## 🚀 Deploy Rápido (Interface Web)

### Passo 1: Criar Projeto no Railway

1. Acesse https://railway.app/new
2. Clique em **"Deploy from GitHub repo"**
3. Selecione o repositório `final_auzap`
4. Railway detectará automaticamente o monorepo

### Passo 2: Configurar Backend API

1. **Criar Serviço Backend**:
   - No dashboard do Railway, clique em **"+ New"** → **"GitHub Repo"**
   - Selecione `final_auzap`
   - Configure:
     - **Name**: `auzap-backend-api`
     - **Root Directory**: `/backend`
     - **Build Command**: `npm ci && npm run build`
     - **Start Command**: `node dist/server.js`

2. **Adicionar Variáveis de Ambiente** (aba "Variables"):
```bash
# Supabase
SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
SUPABASE_ANON_KEY=[REDACTED_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SUPABASE_SERVICE_KEY]

# OpenAI
OPENAI_API_KEY=[REDACTED_OPENAI_KEY]

# Redis Upstash (Production)
UPSTASH_REDIS_REST_URL=https://prime-mullet-17029.upstash.io
UPSTASH_REDIS_REST_TOKEN=[REDACTED_UPSTASH_TOKEN]
REDIS_URL=redis://default:[REDACTED_UPSTASH_TOKEN]@prime-mullet-17029.upstash.io:6379

# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=${RAILWAY_STATIC_URL}

# Baileys
BAILEYS_SESSION_PATH=/app/sessions

# Logging
LOG_LEVEL=info
```

3. **Configurar Networking**:
   - Vá em **Settings** → **Networking**
   - Clique em **"Generate Domain"**
   - Anote a URL gerada (ex: `auzap-backend-api-production.up.railway.app`)

### Passo 3: Configurar Frontend

1. **Criar Serviço Frontend**:
   - Clique em **"+ New"** → **"GitHub Repo"**
   - Selecione `final_auzap` novamente
   - Configure:
     - **Name**: `auzap-frontend`
     - **Root Directory**: `/frontend`
     - **Build Command**: `npm ci && npm run build`
     - **Start Command**: `npx serve dist -s -p $PORT`

2. **Adicionar Variáveis de Ambiente**:
```bash
VITE_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
VITE_SUPABASE_ANON_KEY=[REDACTED_SUPABASE_ANON_KEY]
VITE_API_URL=https://auzap-backend-api-production.up.railway.app
```

3. **Gerar Domínio Público**:
   - **Settings** → **Networking** → **"Generate Domain"**

### Passo 4: Configurar Workers (Opcional)

1. **Criar Serviço Worker**:
   - **Name**: `auzap-workers`
   - **Root Directory**: `/backend`
   - **Start Command**: `node dist/workers/index.js`
   - **Mesmas env vars do backend**

---

## 🔧 Deploy via CLI (Avançado)

### 1. Instalar Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### 2. Inicializar Projeto

```bash
cd /Users/saraiva/final_auzap
railway init
```

### 3. Deploy Backend

```bash
cd backend
railway up
railway open
```

### 4. Adicionar Variáveis via RAW Editor

```bash
railway variables --service auzap-backend-api
# Cole o conteúdo do backend/.env no RAW Editor
```

### 5. Deploy Frontend

```bash
cd ../frontend
railway up
```

---

## 🧪 Validação Pós-Deploy

### 1. Health Check Backend

```bash
curl https://auzap-backend-api-production.up.railway.app/health
```

**Resposta esperada**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T13:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 2. Testar Frontend

Acesse a URL gerada pelo Railway e verifique:
- ✅ Página carrega sem erros
- ✅ Login funciona
- ✅ Dashboard renderiza

### 3. Verificar Logs

```bash
# Via CLI
railway logs --service auzap-backend-api

# Ou via Dashboard → aba "Deployments" → "View Logs"
```

---

## 🔄 CI/CD Automático

### GitHub Actions para Railway

Railway faz deploy automático quando você faz push para `main`. Para customizar:

1. **Desabilitar Auto-Deploy** (opcional):
   - Settings → GitHub → Desmarcar "Auto Deploy"

2. **Trigger Manual**:
```bash
railway up --detach
```

3. **Deploy via GitHub Actions** (veja `.github/workflows/cd-railway.yml`)

---

## 📊 Monitoramento

### Métricas no Dashboard

- **CPU Usage**: Settings → Metrics
- **Memory**: Settings → Metrics
- **Logs**: Deployments → View Logs
- **Build Time**: Deployments → Build Duration

### Alertas

Configure webhooks para notificações:
- Settings → Webhooks → Add Endpoint
- Tipos: `DEPLOY_SUCCESS`, `DEPLOY_FAILURE`, `CRASH`

---

## 🐛 Troubleshooting

### Build Falha

**Problema**: `npm ci` falha
**Solução**:
```bash
# Verificar package-lock.json
cd backend
npm install
git add package-lock.json
git commit -m "fix: update lockfile"
git push
```

### Backend Não Responde

**Problema**: Timeout no health check
**Solução**:
1. Verificar logs: `railway logs`
2. Aumentar timeout: Settings → Deploy → Healthcheck Timeout = 300s
3. Verificar PORT: `process.env.PORT` no código

### Variável de Ambiente Não Carrega

**Problema**: `process.env.X` retorna `undefined`
**Solução**:
1. Verificar se a variável está na aba "Variables"
2. Fazer redeploy: Settings → Redeploy

### Frontend CORS Error

**Problema**: Frontend não consegue conectar ao backend
**Solução**:
```typescript
// backend/src/server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

---

## 💰 Custos Estimados

Railway cobra por uso. Estimativa para AuZap:

| Serviço | vCPU | RAM | Storage | Custo/mês |
|---------|------|-----|---------|-----------|
| Backend API | 1 | 1GB | 1GB | ~$5-10 |
| Workers | 0.5 | 512MB | 1GB | ~$3-5 |
| Frontend | 0.25 | 256MB | 500MB | ~$2-3 |
| **TOTAL** | - | - | - | **~$10-18/mês** |

**Créditos Grátis**: Railway oferece $5/mês grátis para usuários.

---

## 🔗 Links Úteis

- **Dashboard**: https://railway.app/dashboard
- **Docs**: https://docs.railway.app
- **CLI Docs**: https://docs.railway.app/develop/cli
- **Status**: https://status.railway.app
- **Community**: https://discord.gg/railway

---

## 📝 Checklist Deploy

- [ ] Conta Railway criada
- [ ] Repositório conectado ao Railway
- [ ] Serviço Backend criado
- [ ] Variáveis Backend configuradas
- [ ] Domain Backend gerado
- [ ] Serviço Frontend criado
- [ ] Variáveis Frontend configuradas (incluindo VITE_API_URL)
- [ ] Domain Frontend gerado
- [ ] Health check backend (200 OK)
- [ ] Frontend carrega sem erros
- [ ] Login funciona
- [ ] Workers opcionais configurados

---

**Deploy Completo! 🎉**

Próximos passos:
1. Testar WhatsApp connection com número real
2. Validar IA respondendo mensagens
3. Monitorar logs e métricas
4. Configurar domínio customizado (opcional)

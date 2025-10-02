# 🚀 Guia Completo de Deploy - Render

**Data:** 02/10/2025
**Status:** Pronto para Deploy

---

## 📋 Pré-requisitos

### 1. Contas Necessárias
- ✅ [Render.com](https://render.com) - Conta criada
- ✅ [Supabase](https://supabase.com) - Database configurado
- ✅ [Upstash](https://upstash.com) - Redis configurado
- ✅ [OpenAI](https://platform.openai.com) - API Key

### 2. Variáveis de Ambiente
Tenha em mãos:
- `DATABASE_URL` (Supabase Connection String)
- `SUPABASE_URL` (Supabase Project URL)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase Service Role Key)
- `REDIS_URL` (Upstash Redis URL com TLS)
- `UPSTASH_REDIS_REST_URL` (Upstash REST API URL)
- `UPSTASH_REDIS_REST_TOKEN` (Upstash REST Token)
- `OPENAI_API_KEY` (OpenAI API Key)

---

## 🎯 Arquitetura no Render

```
┌─────────────────────┐
│  auzap-frontend     │  Static Site (React)
│  (Static Web)       │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  auzap-api          │  Express API (Node.js)
│  (Web Service)      │  - Port: 3000
│                     │  - Health: /health
└─────────────────────┘
           ↓
┌─────────────────────┐
│  auzap-workers      │  BullMQ Workers (Node.js)
│  (Worker Service)   │  - Message Processor
│                     │  - Follow-up Scheduler
│                     │  - Aurora Proactive
└─────────────────────┘
```

---

## 📝 Passo a Passo

### Opção 1: Deploy via render.yaml (Recomendado)

#### 1. Preparar Repositório
```bash
# Verificar se render.yaml está atualizado
cat render.yaml

# Commit e push (se necessário)
git add render.yaml
git commit -m "feat: Complete render.yaml with backend and worker"
git push origin main
```

#### 2. Criar Blueprint no Render
1. Acessar: https://dashboard.render.com/blueprints
2. Click em **"New Blueprint Instance"**
3. Conectar repositório GitHub: `fellipesaraiva88/auzap-mvp`
4. Render detectará automaticamente o `render.yaml`
5. Configurar variáveis de ambiente (ver seção abaixo)
6. Click em **"Apply"**

#### 3. Configurar Variáveis de Ambiente

**Para auzap-api:**
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://bfrqngrwwwdxuqxuvwis.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REDIS_URL=rediss://...@upstash.io:6379
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
OPENAI_API_KEY=sk-...
WEBHOOK_SECRET=your-webhook-secret-here
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://auzap-frontend.onrender.com
WORKER_CONCURRENCY=5
```

**Para auzap-workers:**
```bash
# (Mesmas variáveis do auzap-api)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://bfrqngrwwwdxuqxuvwis.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REDIS_URL=rediss://...@upstash.io:6379
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
OPENAI_API_KEY=sk-...
WEBHOOK_SECRET=your-webhook-secret-here
NODE_ENV=production
WORKER_CONCURRENCY=5
```

**Para auzap-frontend:**
```bash
VITE_SUPABASE_URL=https://bfrqngrwwwdxuqxuvwis.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://auzap-api.onrender.com
```

---

### Opção 2: Deploy Manual (Alternativa)

#### 1. Backend API (Web Service)

1. **New Web Service**
   - Name: `auzap-api`
   - Environment: `Node`
   - Region: `Oregon`
   - Branch: `main`
   - Root Directory: `backend`

2. **Build & Deploy**
   ```bash
   Build Command: npm install --ignore-scripts && npm run build
   Start Command: npm start
   ```

3. **Advanced Settings**
   - Health Check Path: `/health`
   - Auto-Deploy: `Yes`

4. **Environment Variables**
   - (Adicionar todas as variáveis listadas acima)

#### 2. Workers (Worker Service)

1. **New Background Worker**
   - Name: `auzap-workers`
   - Environment: `Node`
   - Region: `Oregon`
   - Branch: `main`
   - Root Directory: `backend`

2. **Build & Deploy**
   ```bash
   Build Command: npm install --ignore-scripts && npm run build
   Start Command: npm run worker
   ```

3. **Environment Variables**
   - (Adicionar todas as variáveis listadas acima)

#### 3. Frontend (Static Site)

1. **New Static Site**
   - Name: `auzap-frontend`
   - Environment: `Static Site`
   - Region: `Oregon`
   - Branch: `main`

2. **Build Settings**
   ```bash
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```

3. **Environment Variables**
   - (Adicionar variáveis VITE listadas acima)

---

## 🔍 Validação Pós-Deploy

### 1. Backend API

**Health Check:**
```bash
curl https://auzap-api.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T...",
  "uptime": 123
}
```

**Compression (Gzip):**
```bash
curl -I https://auzap-api.onrender.com/api/conversations
```

**Verificar header:**
```
Content-Encoding: gzip
```

**Rate Limiting:**
```bash
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://auzap-api.onrender.com/health
done | tail -5
```

**Esperar `429` após 100 requests**

### 2. Workers

**Verificar Logs:**
```
https://dashboard.render.com/bg/[worker-id]/logs
```

**Buscar por:**
```
✅ Message processor worker ready
✅ Follow-up scheduler worker ready
✅ Aurora proactive worker ready
```

### 3. Frontend

**Acessar:**
```
https://auzap-frontend.onrender.com
```

**Verificar:**
- ✅ Página carrega sem erros
- ✅ Login funciona
- ✅ API conectada

---

## 🐛 Troubleshooting

### Build Falhando

**Problema:** `npm install` ou `npm ci` falha

**Solução:**
```bash
# Usar este build command:
npm install --ignore-scripts && npm run build

# Por que funciona:
# - Instala todas as dependências
# - Ignora lifecycle scripts (husky, prepare)
# - Compila TypeScript normalmente
```

### Workers Não Iniciam

**Problema:** Workers não aparecem nos logs

**Verificar:**
1. Redis está acessível?
   ```bash
   # Testar conexão Redis
   curl $UPSTASH_REDIS_REST_URL/ping \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```

2. Variáveis de ambiente configuradas?
   - `REDIS_URL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

3. Script `worker` existe no package.json?
   ```bash
   "worker": "node dist/workers/index.js"
   ```

### Timeout no Deploy

**Problema:** Build excede 15 minutos

**Solução:**
1. Limpar build cache:
   - Settings → "Clear build cache & deploy"

2. Otimizar dependencies:
   ```bash
   # Remover devDependencies desnecessárias
   npm prune --production
   ```

### Health Check Falha

**Problema:** `/health` retorna 502/503

**Verificar:**
1. PORT está correta (3000)?
2. Express está ouvindo na porta certa?
3. Firewall/Security Rules?

---

## 📊 Monitoramento

### Logs em Tempo Real

**Backend API:**
```
https://dashboard.render.com/web/srv-d3eu56ali9vc73dpca3g/logs
```

**Workers:**
```
https://dashboard.render.com/bg/[worker-id]/logs
```

### Métricas

**Acessar:**
```
Dashboard → Service → Metrics
```

**Monitorar:**
- CPU Usage (< 80%)
- Memory Usage (< 90%)
- Response Time (< 500ms)
- Error Rate (< 1%)

---

## 🎯 Checklist Final

### Antes do Deploy
- [ ] `render.yaml` atualizado
- [ ] Todas as variáveis de ambiente coletadas
- [ ] Build local passou sem erros
- [ ] Testes críticos passando

### Durante o Deploy
- [ ] Backend API deployado com sucesso
- [ ] Workers deployados com sucesso
- [ ] Frontend deployado com sucesso
- [ ] Health checks passando

### Após o Deploy
- [ ] Endpoints testados
- [ ] Workers ativos nos logs
- [ ] Frontend carregando
- [ ] Fluxo completo funcionando:
  - [ ] Cliente envia mensagem → IA responde
  - [ ] Dono envia mensagem → Aurora responde
  - [ ] Mensagens proativas enviadas

---

## 🚀 Otimizações Aplicadas

Após deploy bem-sucedido, você terá:

### Performance
- ✅ **Compression Gzip** - 20-30% redução payload
- ✅ **Rate Limiting** - 100 req/15min por IP
- ✅ **Docker Multi-stage** - 60% redução imagem
- ✅ **BullMQ Optimized** - Workers eficientes
- ✅ **Health Checks** - Monitoramento ativo

### Segurança
- ✅ **Non-root User** - Container seguro
- ✅ **Environment Variables** - Secrets protegidos
- ✅ **HTTPS Only** - TLS/SSL obrigatório
- ✅ **Rate Limiting** - Proteção DDoS

### Escalabilidade
- ✅ **Worker Separado** - Escala independente
- ✅ **Stateless API** - Scale horizontal
- ✅ **Redis Queue** - Processamento assíncrono
- ✅ **Multi-tenant** - Suporta múltiplas orgs

---

## 📞 Suporte

**Documentação:**
- [STATUS_ATUAL.md](STATUS_ATUAL.md) - Status completo
- [SOLUCAO_FINAL_BUILD.md](SOLUCAO_FINAL_BUILD.md) - Fix build
- [Render Docs](https://render.com/docs)

**Logs de Deploy:**
- Ver commits recentes para fixes aplicados
- Commit `c9f4e8a` - Status report
- Commit `47072f8` - Retry strategy
- Commit `40d663c` - Aurora expansions

---

**Última atualização:** 02/10/2025 08:30 BRT
**Responsável:** Fellipe Saraiva - CTO AuZap

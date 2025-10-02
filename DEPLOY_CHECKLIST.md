# 🚀 AuZap - Deploy Checklist

Checklist completo para validar deployment em produção.

---

## 📋 Como Usar

```bash
# Validação completa (recomendado antes do deploy)
chmod +x scripts/deploy-checklist.sh
./scripts/deploy-checklist.sh

# Validação rápida de produção
chmod +x scripts/validate-production.sh
./scripts/validate-production.sh

# Ou adicione aos scripts do package.json
npm run deploy:check
npm run prod:validate
```

---

## 1️⃣ PRÉ-DEPLOY

Validações antes de fazer deploy.

### Git Status
- [ ] 📦 Branch limpo (sem alterações não commitadas)
- [ ] 🌿 Está na branch `main`
- [ ] 🔄 Git pull recente
- [ ] ✅ Último commit passou nos testes

**Como validar:**
```bash
git status                    # Deve estar limpo
git branch --show-current     # Deve ser 'main'
git pull origin main          # Deve estar atualizado
```

**Ação corretiva:**
```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

---

### Build & Compilação
- [ ] 🏗️ Backend build sem erros
- [ ] ⚛️ Frontend build sem erros
- [ ] 📝 TypeScript sem erros de tipo
- [ ] 🎨 Linting passou

**Como validar:**
```bash
cd backend && npm run build
cd frontend && npm run build
npm run typecheck
npm run lint
```

**Ação corretiva:**
```bash
npm run lint:fix              # Auto-fix linting
npm run typecheck             # Ver erros de tipo
```

---

### Environment Variables
- [ ] 📄 `.env` existe e está configurado
- [ ] 🔐 `.env.production` existe (se aplicável)
- [ ] ✅ Todas as variáveis necessárias estão definidas
- [ ] 🚫 Nenhum secret exposto no git

**Variáveis necessárias:**
```bash
# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
REDIS_URL=                    # Upstash em produção
PORT=3000
NODE_ENV=production

# Frontend (.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=
```

**Como validar:**
```bash
# Verificar que .env existe
ls -la backend/.env frontend/.env

# Verificar que não há secrets expostos
git grep -i "sk-" -- "*.ts" "*.js" "*.json"
```

**Ação corretiva:**
```bash
# Copiar exemplo e preencher
cp .env.example .env
# Editar e adicionar valores reais
```

---

### Migrations
- [ ] 🗄️ Todas as migrations foram aplicadas
- [ ] ✅ Schema está sincronizado
- [ ] 🔄 Rollback plan existe

**Como validar:**
```bash
# Listar migrations
npm run db:migrate:status

# Aplicar pendentes
npm run db:migrate
```

---

## 2️⃣ SEGURANÇA

Validações de segurança críticas.

### Supabase RLS
- [ ] 🔒 RLS habilitado em TODAS as tabelas
- [ ] ✅ Policies com `WITH CHECK` definidas
- [ ] 🔐 Service role key apenas no backend
- [ ] 🌐 Anon key apenas no frontend

**Como validar:**
```sql
-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Resultado deve estar vazio!

-- Verificar policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';
-- Todas as tabelas devem ter policies
```

**Ação corretiva:**
```sql
-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Criar policies básicas
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

### Authentication
- [ ] 🔑 JWT funcionando corretamente
- [ ] ⏱️ Token expiration configurado
- [ ] 🔄 Refresh token implementado
- [ ] 🚫 Proteção contra force brute

**Como validar:**
```bash
# Testar login
curl -X POST https://final-auzap.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Deve retornar token JWT
```

---

### CORS & Headers
- [ ] 🌐 CORS configurado corretamente
- [ ] 🔒 Security headers presentes
- [ ] ✅ HTTPS everywhere
- [ ] 🛡️ CSP configurado

**Como validar:**
```bash
# Verificar headers de segurança
curl -I https://final-auzap.onrender.com/health

# Deve incluir:
# - Strict-Transport-Security
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
```

**Ação corretiva:**
```typescript
// backend/src/server.ts
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## 3️⃣ INFRAESTRUTURA

Validação dos serviços em produção.

### Backend (Render)
- [ ] 🟢 Status: Healthy
- [ ] 📊 CPU < 80%
- [ ] 💾 Memory < 80%
- [ ] 🔄 Auto-deploy habilitado
- [ ] 📝 Start command correto

**Como validar:**
```bash
# Health check
curl https://final-auzap.onrender.com/health

# Deve retornar:
# { "status": "ok", "timestamp": "..." }
```

**Endpoints de monitoramento:**
- Dashboard: https://dashboard.render.com
- Logs: https://dashboard.render.com/web/srv-*/logs
- Metrics: https://dashboard.render.com/web/srv-*/metrics

**Start Command esperado:**
```bash
npm run start:production
```

---

### Frontend (Render)
- [ ] 🟢 Status: Healthy
- [ ] ⚡ CDN funcionando
- [ ] 🌐 SSL ativo
- [ ] 📦 Build command correto
- [ ] 📁 Publish directory correto

**Como validar:**
```bash
curl https://final-auzap-frontend.onrender.com
# Deve retornar HTML
```

**Build Settings esperados:**
```bash
Build Command: npm run build
Publish Directory: dist
```

---

### Supabase
- [ ] 🟢 Projeto ativo
- [ ] 🔌 Conexão estabelecida
- [ ] 📊 Database dentro dos limites
- [ ] 🔄 Realtime habilitado

**Como validar:**
```bash
# Testar conexão
curl https://cdndnwglcieylfgzbwts.supabase.co/rest/v1/

# Deve retornar 401 (sem auth) ou lista de endpoints
```

---

### Redis (Upstash)
- [ ] 🟢 Instância ativa
- [ ] 🔌 Conexão estabelecida
- [ ] 📊 Memoria dentro dos limites
- [ ] ⚡ Latência < 100ms

**Como validar:**
```bash
# Via backend logs
# Procurar por: "Redis connected successfully"
```

**Ação corretiva:**
```bash
# Verificar REDIS_URL em .env
# Formato: rediss://default:password@host:6379
```

---

### Workers
- [ ] 🟢 Rodando em produção (se habilitado)
- [ ] 📊 Processando jobs
- [ ] ⚠️ Sem erros nos logs
- [ ] 🔄 Dead letter queue configurada

**Nota:** Workers estão desabilitados em produção sem Redis dedicado.

---

## 4️⃣ FUNCIONALIDADE

Testes funcionais dos endpoints principais.

### Health Endpoints
- [ ] ✅ `/health` retorna 200
- [ ] ⏱️ Response time < 500ms
- [ ] 📊 Inclui timestamp
- [ ] 🔌 Valida conexões

**Como testar:**
```bash
# Backend health
curl https://final-auzap.onrender.com/health

# Deve retornar:
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 3600,
  "database": "connected"
}
```

---

### Auth Endpoints
- [ ] 🔑 Login funcionando
- [ ] 📝 Signup funcionando
- [ ] 🔄 Refresh token OK
- [ ] 🚪 Logout funcionando

**Como testar:**
```bash
# Test signup
curl -X POST https://final-auzap.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login
curl -X POST https://final-auzap.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

### CRUD Endpoints
- [ ] 📋 Campaigns CRUD OK
- [ ] 👥 Contacts CRUD OK
- [ ] 💬 Messages CRUD OK
- [ ] 📱 WhatsApp sessions OK

**Como testar:**
```bash
# Obter token primeiro (do login)
TOKEN="seu_token_aqui"

# Test campaigns list
curl https://final-auzap.onrender.com/api/campaigns \
  -H "Authorization: Bearer $TOKEN"

# Deve retornar array de campaigns
```

---

### WhatsApp Integration
- [ ] 📱 QR Code gerado
- [ ] ✅ Conexão estabelecida
- [ ] 💬 Envio de mensagens OK
- [ ] 🔄 Webhooks recebidos

**Como testar:**
```bash
# Iniciar sessão
curl -X POST https://final-auzap.onrender.com/api/whatsapp/init \
  -H "Authorization: Bearer $TOKEN"

# Verificar status
curl https://final-auzap.onrender.com/api/whatsapp/status \
  -H "Authorization: Bearer $TOKEN"
```

---

### Real-time Features
- [ ] 🔌 Socket.IO conectando
- [ ] 📡 Events sendo emitidos
- [ ] 🔄 Supabase Realtime ativo
- [ ] ⚡ Latência < 100ms

**Como testar:**
```javascript
// No browser console
const socket = io('https://final-auzap.onrender.com');
socket.on('connect', () => console.log('✅ Connected'));
socket.on('qr-code', (qr) => console.log('📱 QR:', qr));
```

---

## 5️⃣ PERFORMANCE

Métricas de performance.

### Response Times
- [ ] ⚡ Health endpoint: < 200ms
- [ ] 📋 List endpoints: < 500ms
- [ ] 💾 Database queries: < 300ms
- [ ] 🔄 Realtime events: < 100ms

**Como medir:**
```bash
# Usando curl com timing
curl -w "\nTime: %{time_total}s\n" \
  https://final-auzap.onrender.com/health

# Ou use scripts/validate-production.sh
./scripts/validate-production.sh
```

**Metas:**
- Health: < 200ms ✅
- API calls: < 500ms ✅
- Database: < 300ms ✅
- Frontend load: < 3s ✅

---

### Cold Start
- [ ] ⏱️ Backend cold start < 10s
- [ ] ⚡ Frontend cold start < 5s
- [ ] 🔄 Warm instances mantidas

**Nota:** Render free tier tem cold start de ~30s após 15min inativo.

---

### Database Optimization
- [ ] 📊 Indexes criados
- [ ] 🔍 Queries otimizadas
- [ ] 📈 Query plan analisado
- [ ] 🗄️ Conexões pooled

**Indexes necessários:**
```sql
-- Verificar indexes existentes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- Criar indexes importantes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
```

---

## 6️⃣ MONITORAMENTO

Configuração de monitoramento e logs.

### Logs
- [ ] 📝 Render logs acessíveis
- [ ] ⚠️ Error tracking configurado
- [ ] 📊 Log levels corretos
- [ ] 🔍 Search funcionando

**Como acessar:**
```bash
# Via Render Dashboard
# Backend: https://dashboard.render.com/web/srv-*/logs
# Frontend: https://dashboard.render.com/static/srv-*/logs

# Filtros úteis:
# - level:error
# - status:500
# - "database error"
```

---

### Metrics
- [ ] 📈 Request rate monitorado
- [ ] ⚡ Response time tracked
- [ ] 💾 Memory usage visible
- [ ] 🔄 Database connections tracked

**Render Metrics disponíveis:**
- CPU Usage
- Memory Usage
- Request Count
- Response Time (p50, p95, p99)
- Error Rate

---

### Alerts
- [ ] 🚨 Error rate > 5%
- [ ] ⚠️ Response time > 2s
- [ ] 💾 Memory > 90%
- [ ] 🔌 Database connection failed

**Configurar em:**
- Render Dashboard > Service > Alerts
- Supabase Dashboard > Database > Alerts

---

### Backups
- [ ] 💾 Database backup ativo
- [ ] 🔄 Backup diário configurado
- [ ] ✅ Restore testado
- [ ] 📦 Point-in-time recovery habilitado

**Supabase Backups:**
- Diários automáticos (último 7 dias)
- Point-in-time recovery (até 30 dias atrás - plano Pro)
- Manual backup disponível

---

## 7️⃣ PÓS-DEPLOY

Validações após deploy.

### Smoke Tests
- [ ] 🧪 Health check passou
- [ ] 🔑 Login funcionando
- [ ] 📋 CRUD básico OK
- [ ] 💬 Real-time OK

**Script de smoke test:**
```bash
#!/bin/bash
# Quick smoke test

BACKEND="https://final-auzap.onrender.com"

echo "🧪 Running smoke tests..."

# Health
curl -f $BACKEND/health || exit 1
echo "✅ Health OK"

# More tests...
```

---

### Documentação
- [ ] 📚 README atualizado
- [ ] 📝 Changelog atualizado
- [ ] 🎯 Notion atualizado
- [ ] 📖 API docs atualizadas

**Checklist de documentação:**
- [ ] Versão do deploy
- [ ] Mudanças principais
- [ ] Breaking changes
- [ ] Migration guide (se necessário)

---

### Comunicação
- [ ] 👥 Time notificado
- [ ] 📧 Stakeholders informados
- [ ] 📱 Status page atualizado
- [ ] 🎉 Celebração! 🚀

---

## 🛠️ Scripts Úteis

### Validação Completa
```bash
# Checklist completo
./scripts/deploy-checklist.sh

# Ou via npm
npm run deploy:check
```

### Validação Rápida de Produção
```bash
# Valida que produção está OK
./scripts/validate-production.sh

# Ou via npm
npm run prod:validate
```

### Rollback
```bash
# Via Render Dashboard
# 1. Ir para Deployments
# 2. Selecionar deploy anterior
# 3. Clicar "Redeploy"

# Ou via CLI (se configurado)
render rollback <service-id>
```

---

## 📊 Métricas de Sucesso

### SLOs (Service Level Objectives)
- ✅ Uptime: > 99.5%
- ⚡ Response time (p95): < 500ms
- 🚨 Error rate: < 1%
- 💾 Database response: < 300ms

### KPIs
- 👥 Active users
- 💬 Messages sent
- 📱 WhatsApp sessions active
- ✅ Campaign success rate

---

## 🆘 Troubleshooting

### Backend não responde
```bash
# 1. Verificar status no Render
# 2. Verificar logs
# 3. Verificar env vars
# 4. Tentar redeploy manual

# Comandos úteis:
render ps <service-id>
render logs <service-id>
```

### Database connection error
```bash
# 1. Verificar Supabase status
# 2. Verificar SUPABASE_URL e keys
# 3. Verificar RLS policies
# 4. Verificar connection pool

# Test connection:
psql $DATABASE_URL -c "SELECT 1"
```

### WhatsApp não conecta
```bash
# 1. Verificar Redis connection
# 2. Limpar sessão antiga
# 3. Gerar novo QR code
# 4. Verificar logs de erro

# Limpar sessão:
curl -X DELETE https://final-auzap.onrender.com/api/whatsapp/session \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Referências

- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Architecture](./docs/ARCHITECTURE.md)

---

## ✅ Quick Start

```bash
# 1. Executar checklist completo
chmod +x scripts/deploy-checklist.sh
./scripts/deploy-checklist.sh

# 2. Se tudo OK, fazer deploy
git push origin main  # Auto-deploy no Render

# 3. Validar produção
./scripts/validate-production.sh

# 4. Atualizar Notion
# 5. Celebrar! 🎉
```

---

**Última atualização:** 2025-10-02
**Versão:** 1.0.0
**Status:** ✅ Production Ready

# 🚀 PLANO COMPLETO DE IMPLEMENTAÇÃO - AUZAP

**Projeto:** AuZap - Plataforma SaaS WhatsApp Automation com Dupla IA  
**Status Atual:** Supabase criado, 4/15 tabelas implementadas  
**Objetivo:** Sistema completo em produção, pronto para clientes beta  

---

## 📊 STATUS ATUAL DO PROJETO

### ✅ Completado
- [x] Supabase criado (projeto: auzap, região: us-east-2)
- [x] 4 tabelas criadas: organizations, users, organization_settings, whatsapp_instances
- [x] Documentação técnica completa
- [x] Arquitetura definida

### ❌ Faltando
- [ ] 11 tabelas do banco de dados
- [ ] Backend completo (API + Services + Workers)
- [ ] Frontend dashboard
- [ ] Integração WhatsApp (Baileys)
- [ ] Integração OpenAI
- [ ] Deploy e infraestrutura
- [ ] Testes e validação

---

## 🎯 STACK TECNOLÓGICA DEFINITIVA

### Backend
```
- Node.js 20+
- Express.js + TypeScript
- @whiskeysockets/baileys (WhatsApp nativo)
- OpenAI SDK (GPT-4o)
- @supabase/supabase-js
- BullMQ + ioredis (filas)
- Socket.io (real-time)
- Zod (validação)
- Pino (logs)
```

### Frontend
```
- React 18 + Vite
- TypeScript
- shadcn/ui + Tailwind CSS
- TanStack Query (React Query)
- TanStack Router
- Supabase Auth
- Socket.io-client
- Zustand (state)
- React Hook Form + Zod
```

### Infraestrutura
```
- Supabase Cloud (Database + Auth + Storage)
- Render (Web Service + Worker Service)
- Upstash Redis (Queue)
- Cloudflare (CDN - opcional)
```

---

## 📅 PLANO DE EXECUÇÃO - 8 FASES

---

## **FASE 1: FUNDAÇÃO DO BANCO DE DADOS** ⏱️ 2-3 horas

### Objetivo
Completar schema do Supabase com 11 tabelas restantes + RLS + triggers

### Tarefas Simultâneas

#### 1.1 - Criar tabelas Core restantes
```sql
-- services
-- authorized_owner_numbers
```

#### 1.2 - Criar tabelas Clientes & Pets
```sql
-- contacts
-- pets  
-- bookings
```

#### 1.3 - Criar tabelas IA Cliente
```sql
-- conversations
-- messages
-- ai_interactions
-- scheduled_followups
```

#### 1.4 - Criar tabelas Aurora
```sql
-- aurora_proactive_messages
-- aurora_automations
```

### Validação
- [x] `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'` retorna 15
- [x] Todas as foreign keys funcionando
- [x] RLS habilitado em todas as tabelas
- [x] Triggers de updated_at funcionando

### Entregável
✅ Banco de dados completo e testado

---

## **FASE 2: SETUP BACKEND BASE** ⏱️ 4-5 horas

### Objetivo
Estrutura do projeto backend + configurações + tipos

### Tarefas Simultâneas

#### 2.1 - Inicializar projeto Node
```bash
mkdir backend && cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express
npm install dotenv cors helmet morgan
npm install -D nodemon @types/cors @types/morgan
```

#### 2.2 - Configurar TypeScript + ESLint
```json
// tsconfig.json
// .eslintrc.json
```

#### 2.3 - Criar estrutura de pastas
```
backend/
├── src/
│   ├── config/         # Configurações
│   ├── types/          # TypeScript types
│   ├── middleware/     # Express middlewares
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── workers/        # BullMQ workers
│   ├── utils/          # Helpers
│   └── index.ts        # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```

#### 2.4 - Setup configurações base
```typescript
// src/config/supabase.ts
// src/config/openai.ts
// src/config/redis.ts
// src/config/logger.ts
```

### Validação
- [x] `npm run dev` inicia servidor
- [x] TypeScript compilando sem erros
- [x] Conexão Supabase funcionando
- [x] Logs estruturados (Pino)

### Entregável
✅ Backend base rodando em desenvolvimento

---

## **FASE 3: BAILEYS SERVICE (WHATSAPP)** ⏱️ 6-8 horas

### Objetivo
Integração completa com WhatsApp via Baileys + pairing code

### Tarefas Simultâneas

#### 3.1 - Instalar Baileys + dependências
```bash
npm install @whiskeysockets/baileys
npm install @hapi/boom qrcode-terminal pino
npm install sharp # para processamento de mídia
```

#### 3.2 - Implementar BaileysService
```typescript
// src/services/baileys.service.ts
- initializeInstance()
- generatePairingCode()
- sendMessage()
- setupEventHandlers()
- saveSession()
- loadSession()
```

#### 3.3 - Criar rotas WhatsApp
```typescript
// src/routes/whatsapp.routes.ts
POST   /api/whatsapp/instances         # Criar instância
POST   /api/whatsapp/instances/:id/connect  # Conectar com pairing code
GET    /api/whatsapp/instances/:id/status   # Status da conexão
DELETE /api/whatsapp/instances/:id     # Desconectar
POST   /api/whatsapp/instances/:id/send     # Enviar mensagem
```

#### 3.4 - Implementar webhook receiver
```typescript
// src/routes/webhook.routes.ts
POST /webhook/whatsapp/:instanceId
- Receber mensagens
- Adicionar na fila BullMQ
```

### Validação
- [x] Gerar pairing code de 8 dígitos
- [x] Conectar número WhatsApp real
- [x] Receber mensagens
- [x] Enviar mensagens
- [x] Session persistir no Supabase

### Entregável
✅ WhatsApp conectado e funcionando

---

## **FASE 4: OPENAI + IA CLIENTE** ⏱️ 8-10 horas

### Objetivo
Assistente de IA para atender clientes finais

### Tarefas Simultâneas

#### 4.1 - Setup OpenAI SDK
```bash
npm install openai
```

#### 4.2 - Implementar ClientAIService
```typescript
// src/services/client-ai.service.ts
- processClientMessage()
- getSystemPrompt()
- getFunctions() // Function calling
- executeFunction()
```

#### 4.3 - Criar Function Calling tools
```typescript
// Funções disponíveis para IA:
- register_pet()           # Cadastrar pet
- book_appointment()       # Agendar consulta
- check_availability()     # Ver horários
- get_pet_history()        # Histórico do pet
- escalate_to_human()      # Escalar para humano
```

#### 4.4 - Implementar lógica de conversação
```typescript
// src/services/conversation.service.ts
- createConversation()
- addMessage()
- getConversationHistory()
- updateConversationStatus()
```

### Validação
- [x] IA responde perguntas básicas
- [x] IA cadastra pets via conversa
- [x] IA agenda consultas
- [x] IA consulta histórico
- [x] Function calling funcionando

### Entregável
✅ IA Cliente funcionando end-to-end

---

## **FASE 5: AURORA (IA DO DONO)** ⏱️ 8-10 horas

### Objetivo
Assistente Aurora para donos/gerentes

### Tarefas Simultâneas

#### 5.1 - Implementar Aurora Service
```typescript
// src/services/aurora.service.ts
- processOwnerMessage()
- getAuroraSystemPrompt()
- getAuroraFunctions()
- executeAuroraFunction()
```

#### 5.2 - Criar Analytics Functions
```typescript
// Funções Aurora:
- get_bookings_analytics()    # Agendamentos
- get_revenue_analytics()     # Receita
- get_inactive_clients()      # Clientes inativos
- get_pets_needing_service()  # Pets precisando serviço
- get_daily_summary()         # Resumo do dia
```

#### 5.3 - Implementar Automation Functions
```typescript
- fill_agenda()              # Preencher agenda
- send_campaign()            # Enviar campanha
- schedule_messages()        # Agendar mensagens
- identify_opportunities()   # Oportunidades
```

#### 5.4 - Middleware de detecção de dono
```typescript
// src/middleware/aurora-auth.middleware.ts
- detectOwnerNumber()
- checkPermissions()
```

### Validação
- [x] Aurora reconhece número do dono
- [x] Analytics conversacional funcionando
- [x] Aurora preenche agenda
- [x] Aurora envia campanhas
- [x] Diferenciação Cliente vs Dono

### Entregável
✅ Aurora completa e funcional

---

## **FASE 6: MESSAGE PROCESSOR WORKER** ⏱️ 5-6 horas

### Objetivo
Worker BullMQ para processar mensagens em background

### Tarefas Simultâneas

#### 6.1 - Setup BullMQ + Redis
```bash
npm install bullmq ioredis
```

#### 6.2 - Implementar Message Queue
```typescript
// src/config/redis.ts
- Conexão Redis
- Criar queue 'messages'
```

#### 6.3 - Implementar Worker
```typescript
// src/workers/message-processor.ts
- Processar job de mensagem
- Detectar tipo (dono ou cliente)
- Rotear para IA correta
- Enviar resposta via Baileys
- Salvar histórico
```

#### 6.4 - Implementar retry logic
```typescript
// Configurar retry
- maxAttempts: 3
- backoff: exponential
- Dead letter queue
```

### Validação
- [x] Mensagens entrando na fila
- [x] Worker processando jobs
- [x] Retry funcionando em caso de erro
- [x] Logs detalhados

### Entregável
✅ Sistema de filas funcionando

---

## **FASE 7: FRONTEND DASHBOARD** ⏱️ 12-15 horas

### Objetivo
Interface web completa para donos

### Tarefas Simultâneas

#### 7.1 - Setup projeto React
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @tanstack/react-query @tanstack/react-router
npm install @supabase/supabase-js
npm install socket.io-client
npm install zustand
npm install react-hook-form zod @hookform/resolvers
```

#### 7.2 - Setup shadcn/ui
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea
npx shadcn-ui@latest add dialog alert select badge
npx shadcn-ui@latest add table tabs avatar dropdown-menu
```

#### 7.3 - Implementar páginas principais
```typescript
// src/pages/
- Dashboard.tsx          # Home com Aurora
- Conversations.tsx      # IA Cliente
- Bookings.tsx          # Agenda
- Clients.tsx           # Clientes & Pets
- WhatsApp.tsx          # Configuração WhatsApp
- Settings.tsx          # Configurações
```

#### 7.4 - Implementar componentes Aurora
```typescript
// src/components/aurora/
- AuroraChat.tsx        # Chat com Aurora
- AuroraInsights.tsx    # Cards de insights
- AuroraMetrics.tsx     # Métricas do dia
```

### Validação
- [x] Login com Supabase Auth
- [x] Dashboard renderizando
- [x] Chat Aurora funcionando
- [x] Dados em tempo real
- [x] Responsivo

### Entregável
✅ Dashboard funcional e bonito

---

## **FASE 8: DEPLOY E PRODUÇÃO** ⏱️ 4-6 horas

### Objetivo
Sistema em produção, acessível via internet

### Tarefas Simultâneas

#### 8.1 - Setup Upstash Redis
```
1. Criar conta Upstash
2. Criar Redis database
3. Copiar URL e token
4. Atualizar .env
```

#### 8.2 - Deploy Backend (Render)
```yaml
# render.yaml
services:
  - type: web
    name: auzap-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    
  - type: worker
    name: auzap-worker
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run worker
```

#### 8.3 - Deploy Frontend (Render Static Site)
```yaml
services:
  - type: web
    name: auzap-dashboard
    buildCommand: npm run build
    publishPath: dist
```

#### 8.4 - Configurar variáveis de ambiente
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
REDIS_URL
NODE_ENV=production
```

### Validação
- [x] Backend acessível via HTTPS
- [x] Frontend acessível via HTTPS
- [x] WhatsApp conectando em produção
- [x] Worker processando mensagens
- [x] Logs funcionando

### Entregável
✅ Sistema 100% em produção

---

## 🎯 CRONOGRAMA ESTIMADO

| Fase | Duração | Dependências |
|------|---------|--------------|
| 1. Banco de Dados | 2-3h | - |
| 2. Backend Base | 4-5h | Fase 1 |
| 3. Baileys WhatsApp | 6-8h | Fase 2 |
| 4. IA Cliente | 8-10h | Fase 2, 3 |
| 5. Aurora | 8-10h | Fase 2, 3 |
| 6. Worker | 5-6h | Fase 3, 4, 5 |
| 7. Frontend | 12-15h | Fase 1, 2 |
| 8. Deploy | 4-6h | Todas |

**Total:** 49-63 horas (~1-2 semanas full-time)

---

## 🔥 SEQUÊNCIA DE EXECUÇÃO RECOMENDADA

### Semana 1 (Backend)
1. **Dia 1-2:** Fases 1, 2, 3 (Banco + Backend + WhatsApp)
2. **Dia 3-4:** Fases 4, 5 (IA Cliente + Aurora)
3. **Dia 5:** Fase 6 (Worker)

### Semana 2 (Frontend + Deploy)
1. **Dia 1-3:** Fase 7 (Frontend completo)
2. **Dia 4:** Fase 8 (Deploy)
3. **Dia 5:** Testes, ajustes, documentação

---

## ✅ CHECKLIST DE VALIDAÇÃO FINAL

### Backend
- [ ] WhatsApp conectado e recebendo mensagens
- [ ] IA Cliente respondendo corretamente
- [ ] Aurora reconhecendo donos
- [ ] Function calling funcionando
- [ ] Worker processando filas
- [ ] Logs estruturados
- [ ] Tratamento de erros robusto

### Frontend
- [ ] Login funcionando
- [ ] Dashboard completo
- [ ] Chat Aurora em tempo real
- [ ] Listagens funcionando
- [ ] Formulários validados
- [ ] Responsivo mobile

### Produção
- [ ] HTTPS configurado
- [ ] Variáveis de ambiente seguras
- [ ] Backups automáticos Supabase
- [ ] Monitoramento básico
- [ ] Health checks

---

## 📦 DEPENDÊNCIAS EXTERNAS NECESSÁRIAS

### Contas e Serviços
- [x] Supabase (já criado: cdndnwglcieylfgzbwts)
- [ ] OpenAI (API key com créditos)
- [ ] Upstash Redis (grátis até 10k comandos/dia)
- [ ] Render (grátis para teste)
- [ ] Número WhatsApp real (para testes)

### Custos Mensais Estimados (Produção)
- Supabase Free: $0
- OpenAI (uso moderado): ~$20-50
- Upstash Redis Free: $0
- Render Free tier: $0
- **Total MVP:** ~$20-50/mês

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Baileys quebrar API WhatsApp | Média | Alto | Versão fixa, testes contínuos |
| OpenAI rate limits | Baixa | Médio | Implementar retry + cache |
| Supabase RLS mal configurado | Média | Alto | Testes de segurança |
| Worker parar de processar | Baixa | Alto | Health checks + restart automático |

---

## 📚 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **Executar Fase 1:** Completar schema do banco
2. ✅ **Criar repositório Git:** Iniciar versionamento
3. ✅ **Setup OpenAI:** Criar conta e API key
4. ✅ **Começar Fase 2:** Estrutura backend base

---

## 🎓 RECURSOS E DOCUMENTAÇÃO

### Oficiais
- Baileys: https://github.com/WhiskeySockets/Baileys
- OpenAI API: https://platform.openai.com/docs
- Supabase: https://supabase.com/docs
- BullMQ: https://docs.bullmq.io
- shadcn/ui: https://ui.shadcn.com

### Templates e Exemplos
- Baileys Multi-device: https://github.com/WhiskeySockets/Baileys/tree/master/Example
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- Supabase RLS Examples: https://supabase.com/docs/guides/auth/row-level-security

---

**Desenvolvido por:** Fellipe Saraiva + Claude Code  
**Última atualização:** 01/10/2025  
**Status:** 🚀 PRONTO PARA EXECUÇÃO

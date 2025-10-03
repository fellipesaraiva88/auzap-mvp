# CLAUDE.md

# AuZap - Claude Code Configuration

**Project:** WhatsApp Automation SaaS for Petshops/Clinics

**Stack:** Node.js + TypeScript + React + Supabase + Baileys + OpenAI

**Status:** Aurora Enhanced (Oct 2025) - Client AI with 6+ functions, Aurora CS with full shop context, New vertical services

---

## 🎯 Project Identity

**What is AuZap?**

SaaS platform that provides petshops/clinics with dual-layer AI automation:

1. **Client Agent** - Automated customer service via WhatsApp (pet registration, booking, FAQs, training plans, daycare, BIPE protocol)
2. **Aurora** - Business partner AI for owners (analytics, proactive campaigns, insights, full context awareness)

**Current Phase:** Transforming from MVP to production-ready multi-tenant platform with premium dashboard.

**Key Differentiator:** Native WhatsApp integration (Baileys) with intelligent owner/client detection for dual AI routing.

---

## 🏗️ Architecture Overview

### Core Components

```
WhatsApp Message → Baileys → BullMQ Queue
                              ↓
                    Message Processor Worker
                              ↓
                    ┌─────────┴─────────┐
              Owner Number?        Client Number?
                    ↓                   ↓
              Aurora AI           Client AI
            (Analytics/Ops)    (Booking/Support)
```

### Tech Stack

**Backend:**

- Runtime: Node.js 20 + TypeScript
- Framework: Express.js
- WhatsApp: @whiskeysockets/baileys (native, pairing code)
- AI: OpenAI GPT-4 + Function Calling
- Queue: BullMQ + Redis (Upstash)
- DB: Supabase (PostgreSQL + RLS multi-tenant)
- Real-time: [Socket.io](http://Socket.io)

**Frontend:**

- Framework: React 18 + Vite (transitioning to Next.js 14)
- UI: shadcn/ui + Tailwind CSS
- State: TanStack Query
- Auth: Supabase Auth (JWT)

**Infrastructure:**

- Deploy: Render (Web Service + Worker + Static)
- Storage: Supabase Storage
- Monitoring: Render native + Winston JSON logs

### Database Schema (19 tables)

**Core:** organizations, users, organization_settings, whatsapp_instances, services, authorized_owner_numbers

**Clients:** contacts, pets, bookings

**WhatsApp:** conversations, messages, ai_interactions, scheduled_followups

**Aurora:** aurora_proactive_messages, aurora_automations, clientes_esquecidos

**New Verticals (Oct 2025):**
- **training_plans** - Planos de adestramento com sessões e progresso
- **daycare_hotel_stays** - Hospedagem/daycare com check-in/check-out
- **bipe_protocol** - Protocolo BIPE (Behavioral, Individual, Preventive, Emergent)
- **knowledge_base** - Base de conhecimento para respostas rápidas Aurora/Cliente

**Key Patterns:**

- Multi-tenant with RLS (Row Level Security)
- Tenant-aware middleware on all routes
- Optimized indexes for performance (Context7 best practices)

---

## 🧠 Development Philosophy

### Cognitive Approach (from Agent Instructions)

You operate at **cognitive level 4-5** (Elliott Jaques framework):

- Identify systemic patterns invisible to others
- Think non-linearly, connect unrelated concepts
- Project 2nd and 3rd order consequences
- Focus on long-term potential, not just immediate fixes
- Recognize unique structures in data/situations

### UX Principle: "Impacto > Atividade"

**Always prioritize real value (time/money saved) over technical metrics.**

Examples:

- ❌ "5,000 messages processed"
- ✅ "Saved 12 hours of manual responses"
- ❌ "80% automation rate"
- ✅ "Generated R$3,200 in automated bookings"

### Code Quality Standards

1. **Performance First:** Sub-200ms API responses (p95), indexed queries <50ms
2. **Security:** RLS on all tables, rate limiting, input validation, no exposed secrets
3. **Multi-tenant Isolation:** Every query filtered by organization_id
4. **Type Safety:** Strict TypeScript, no `any` without justification
5. **Error Handling:** Comprehensive try-catch, user-friendly messages, structured logging
6. **Testing:** Unit tests for services, E2E for critical flows

---

## 📋 Development Rules

### DO:

✅ **Use existing patterns:** Follow established service/middleware/worker structure

✅ **Check RLS:** Every new table needs RLS policies for organization_id

✅ **Add indexes:** For any column used in WHERE/JOIN (consult Performance Optimization Report)

✅ **Validate tenant context:** Use TenantMiddleware on all routes

✅ **Log structured:** Winston JSON format with organizationId, duration, context

✅ **Handle Baileys reconnection:** WhatsApp sessions can drop, implement retry logic

✅ **Use Function Calling:** For AI actions (booking, training, daycare, BIPE) - don't parse freeform

✅ **Keep scope tight:** Implement exactly what's requested, no over-engineering

✅ **Cite sources:** Reference specific Notion pages when implementing from docs

✅ **Use Knowledge Base:** Consult `knowledge_base` table for common answers before hardcoding

✅ **Enable Handoff:** Message worker can route Aurora → Client AI when needed

### DON'T:

❌ **Break multi-tenancy:** Never query without organization_id filter

❌ **Skip RLS:** Even "internal" tables need policies

❌ **Use QR codes:** Prefer pairing code (8-digit) for WhatsApp connection

❌ **Modify worker structure:** It's production-stable, extend carefully

❌ **Add unauthorized schemas:** Consult Schema SQL Completo page first

❌ **Over-optimize prematurely:** Follow "works first, fast second" unless perf issue exists

❌ **Change Aurora detection logic:** Owner number recognition is critical security boundary

❌ **Deploy without health checks:** Backend must expose /health, /health/redis, /health/supabase

### ALWAYS ASK BEFORE:

⚠️ Changing database schema (properties, types, relations)

⚠️ Modifying BullMQ worker structure

⚠️ Altering Aurora/Client AI routing logic

⚠️ Adding new external dependencies

⚠️ Changing deployment configuration

⚠️ Refactoring across multiple services

---

## 🗂️ Project Structure

### Backend (`backend/`)

```
src/
├── config/          # Supabase, OpenAI, Redis clients
├── services/        # Business logic (baileys, ai, aurora, contacts, pets, bookings, training, daycare, bipe, knowledge-base)
├── middleware/      # Auth, tenant, rate limiting
├── workers/         # BullMQ processors (message-processor, aurora-proactive, followups)
├── routes/          # Express endpoints
│   ├── training.routes.ts    # Training plans CRUD (NEW Oct 2025)
│   ├── daycare.routes.ts     # Daycare/Hotel CRUD (NEW Oct 2025)
│   └── bipe.routes.ts        # BIPE Protocol CRUD (NEW Oct 2025)
└── server.ts        # Express app + Socket.io
```

**Key Files:**

- `baileys.service.ts` - WhatsApp connection, message sending, session management
- `ai.service.ts` - Client AI (booking, pet registration, FAQs, training, daycare, BIPE)
- `aurora.service.ts` - Owner AI (analytics, automation, insights, full shop context)
- `message-processor.ts` - Routes messages to correct AI based on sender with handoff support

**New Services (Oct 2025):**
- `training.service.ts` - Gestão de planos de adestramento
- `daycare.service.ts` - Gestão de hospedagem/daycare
- `bipe.service.ts` - Protocolo BIPE para saúde pet
- `knowledge-base.service.ts` - Base de conhecimento compartilhada

### Frontend (`frontend/`)

```
src/
├── components/      # React components (shadcn/ui)
├── lib/             # Utils, Supabase client, API helpers
├── pages/           # Route pages
└── App.tsx          # Main app + routing
```

### Documentation (Notion)

All technical specs are in Notion workspace "Work Space Pangeia":

- **🏗️ AuZap - Arquitetura Completa v2** - Complete system overview
- **2️⃣ Schema SQL Completo** - All 19 tables (updated Oct 2025), RLS policies, indexes
- **3️⃣ BaileysService Completo** - WhatsApp integration patterns
- **4️⃣ Aurora Service Completo** - Owner AI with full context implementation
- **5️⃣ Message Processor Worker** - Routing logic with handoff support
- **🚀 Performance Optimization Report** - Indexes, query optimization
- **📊 Andamento da Auzap** - Project progress tracking (write-enabled)

**Recent Updates (Oct 2025):**
- Training Plans service and routes documentation
- Daycare/Hotel service implementation
- BIPE Protocol integration guide
- Knowledge Base management
- Aurora CS context enhancement guide

---

## 🔧 Common Tasks

### Adding a New Service Method

1. Add method to appropriate service (`src/services/`)
2. Use `TenantAwareSupabase` for DB access (auto-filters by org)
3. Add structured logging with Winston
4. Export and use in routes with `TenantMiddleware`
5. Add unit test in `tests/services/`

### Adding a New Database Table

1. **Consult Schema SQL Completo page first** - Ensure no duplicate
2. Create migration in `supabase/migrations/` directory (format: `YYYYMMDD_description.sql`)
3. Add `organization_id UUID REFERENCES organizations` (unless global table)
4. Create RLS policies: `SELECT/INSERT/UPDATE/DELETE` filtered by org
5. Add indexes on: organization_id, frequently queried columns
6. Update `src/types/` with TypeScript interface
7. Test with multiple orgs to verify isolation

**Recent Migrations (Oct 2025):**
- `20251003_fix_internal_users_password.sql` - Fix internal users authentication

### Adding a New AI Function (Function Calling)

1. Define function schema in `ai.service.ts` or `aurora.service.ts`
2. Implement handler function (use appropriate service: training, daycare, bipe, etc.)
3. Add to OpenAI `tools` array
4. Handle function call in response processor
5. Log all AI interactions to `ai_interactions` table
6. Test edge cases (missing params, invalid data)

**Recent Functions Added (Oct 2025):**
- `criar_plano_adestramento` - Create training plans with sessions
- `listar_planos_adestramento` - List training plans for a contact
- `criar_reserva_hospedagem` - Create daycare/hotel reservations
- `listar_reservas_hospedagem` - List reservations for a contact
- `criar_protocolo_bipe` - Create BIPE protocol entries
- `consultar_base_conhecimento` - Query knowledge base for answers

### Debugging WhatsApp Connection

1. Check `/health` endpoint - Is backend alive?
2. Check `/health/redis` - BullMQ requires Redis
3. Check `/health/supabase` - Session persistence needs DB
4. Review `backend/sessions/auth_info.json` - Session data present?
5. Check logs for "connection closed" - Baileys may need reconnect
6. Test pairing code flow: Generate → Enter in app → Verify QR-less login

### Performance Issue Investigation

1. Check Winston logs for slow queries (duration >100ms)
2. Review Performance Optimization Report for index recommendations
3. Use `EXPLAIN ANALYZE` in Supabase SQL editor
4. Verify RLS policies aren't causing seq scans
5. Check BullMQ queue depth - Worker keeping up?
6. Monitor Render metrics - CPU/Memory limits?

### Administrative Scripts

**Location:** `backend/scripts/`

**Available Scripts:**
- `fix-internal-users.ts` - Fix authentication for internal/system users

**Running Scripts:**
```bash
cd backend
npx ts-node scripts/fix-internal-users.ts
```

**Best Practices:**
- Always backup database before running admin scripts
- Test scripts on staging first
- Log all operations for audit trail
- Use transactions when modifying multiple records

---

## 🚀 Deployment

### Current Status

**Production:**

- Frontend: LIVE at [auzap-frontend.onrender.com](http://auzap-frontend.onrender.com)
- Backend: ⚠️ BUILD FAILED - Docker/render.yaml fixes pending
- Issue tracked in: "🚨 Deploy Issue - Backend Build Failed"

**Environments:**

- **Staging:** Auto-deploy on `develop` branch (GitHub Actions)
- **Production:** Manual deploy on `main` branch (requires version tag)

### Deployment Workflow

```bash
# Staging (automatic)
git push origin develop

# Production (manual with safety checks)
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
# Trigger GitHub Action: deploy-production.yml
```

**Safety Features:**

- ✅ Database backup before deploy
- ✅ Comprehensive test suite (unit + E2E)
- ✅ Health check validation post-deploy
- ✅ Automatic rollback on failure
- ✅ Security scanning (secrets, vulnerabilities)

### Environment Variables

**Required for Backend:**

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
REDIS_URL=         # Upstash Redis
NODE_ENV=production
```

**Required for Frontend:**

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 🎯 Current Sprint: Enhancement & Expansion (Oct 2025)

### Recent Achievements (Oct 2025)

1. ✅ **Aurora CS Enhanced** - Full shop context awareness with comprehensive data access
2. ✅ **Client AI Expansion** - 6 new functions (training, daycare, BIPE, knowledge base)
3. ✅ **Message Worker Handoff** - Aurora can seamlessly hand off to Client AI
4. ✅ **New Vertical Services** - Training, Daycare, BIPE Protocol tables and services
5. ✅ **Dashboard Integration** - Real data from Supabase, no mocks

### Current Focus

1. 🚧 **Fix Internal Users** - Migration para corrigir senhas de usuários internos
2. 🚧 **Backend Deployment** - Render build stability
3. ⏳ **WhatsApp Testing** - Pairing code validation
4. ⏳ **Knowledge Base UI** - Interface para gestão de KB

### Next Up: Fase 3 (Proativo)

- Proactive message workers for Aurora
- Daily summary automation (18h send)
- Opportunity detection (holidays, inactive clients)
- Campaign automation with new verticals

### Success Metrics

- ✅ Aurora context fully operational (6+ data sources)
- ✅ Client AI handling 6+ service types
- 🎯 Backend stable on Render
- 🎯 First beta petshop fully onboarded
- 🎯 All new verticals (training, daycare, BIPE) operational

---

## 📞 Key Contacts & Resources

**Developer:** Fellipe Saraiva ([eu@saraiva.ai](mailto:eu@saraiva.ai))

**Workspace:** Work Space Pangeia

**GitHub:** [Repository location needed]

**Project Tracker:** "auz" page in Notion

**Quick Links:**

- Health Check: [https://auzap-api.onrender.com/health](https://auzap-api.onrender.com/health)
- Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Render Dashboard: [https://dashboard.render.com](https://dashboard.render.com)
- Upstash Console: [https://console.upstash.com](https://console.upstash.com)

---

## 💡 Tips for Working with Claude on AuZap

1. **Reference Notion pages:** "Check Schema SQL Completo before modifying DB"
2. **Specify scope clearly:** "Add a booking validation function" vs "improve bookings"
3. **Mention constraints:** "Keep under 50ms response time" or "Must work multi-tenant"
4. **Ask for explanations:** "Why is this query slow?" - I'll trace through RLS/indexes
5. **Request patterns:** "Show me the pattern for adding a new worker"
6. **Use project vocabulary:** Aurora, Agente Cliente, Pairing Code, RLS, TenantMiddleware, BIPE, Knowledge Base
7. **Batch related changes:** "Add pet vaccine tracking: DB table, service, route, types"
8. **Validate multi-tenant:** "Test this with multiple orgs" - I'll simulate isolation
9. **Leverage new verticals:** "Use training service for...", "Check BIPE protocol for..."
10. **Update Notion progress:** I'll document progress in "Andamento da Auzap" page automatically

---

## 🔒 Security Boundaries

**CRITICAL - Never Compromise:**

1. **RLS Policies:** Every table must enforce organization_id isolation
2. **Owner Number Detection:** Aurora must only respond to authorized_owner_numbers
3. **JWT Validation:** All API routes require valid Supabase token
4. **Rate Limiting:** Prevent abuse of WhatsApp/AI endpoints
5. **Input Sanitization:** All user input validated before DB insertion
6. **Secret Management:** No secrets in code, only env vars
7. **CORS Configuration:** Whitelist only known frontend domains

**Audit on Every Change:**

- Could this leak data across organizations?
- Could a client access owner-only features?
- Could this be abused to exhaust resources?

---

## 📝 Recent Updates Summary (October 2025)

### 🎯 Major Enhancements

**Aurora AI Evolution:**
- Full shop context awareness with 6+ data sources
- Seamless handoff to Client AI via message worker
- Enhanced with `clientes_esquecidos` tracking

**Client AI Expansion:**
- Added 6 new functions covering training, daycare, BIPE protocol, and knowledge base
- Intelligent service routing based on conversation context

**New Vertical Services:**
- 🐕 **Training Plans** - Complete adestramento management with sessions tracking
- 🏨 **Daycare/Hotel** - Reservation system with check-in/check-out flows
- 🏥 **BIPE Protocol** - Behavioral, Individual, Preventive, Emergent health tracking
- 📚 **Knowledge Base** - Centralized FAQ system for both AIs

### 🗄️ Database Updates
- Expanded from 15 to 19 tables
- Added migrations for new verticals
- Maintained RLS policies across all new tables
- Created administrative scripts for data fixes

### 🛠️ Technical Improvements
- New service layer: `TrainingService`, `DaycareService`, `BipeService`, `KnowledgeBaseService`
- New routes: `training.routes.ts`, `daycare.routes.ts`, `bipe.routes.ts`
- Enhanced message worker with AI handoff capability
- Dashboard integration with real Supabase data

### 🔄 Next Steps
- Complete backend deployment stabilization
- WhatsApp pairing code validation
- Knowledge Base UI development
- Begin Fase 3 (Proativo) implementation

---

*This CLAUDE.md is the single source of truth for Claude Code working on AuZap. Updated October 2025.*
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AuZap - WhatsApp Automation SaaS Platform

**Project Type:** Multi-tenant SaaS for Petshops/Veterinary Clinics
**Architecture:** Monorepo with Dual-Stack (Frontend + Backend)
**Core Stack:** TypeScript everywhere - React (Vite) + Node.js (Express) + Supabase + Baileys + OpenAI GPT-4
**Status:** Production-Ready MVP with Aurora Enhanced (Oct 2025)

---

## 🚀 Quick Start Commands

### Development Setup
```bash
# Clone and install
git clone <repo>
cd autonomous-paw-actuator-main
npm install                    # Frontend dependencies
cd backend && npm install      # Backend dependencies

# Environment setup (copy .env.example and configure)
cp .env.example .env          # Frontend env
cd backend && cp .env.example .env  # Backend env

# Start development
npm run dev                   # Frontend (http://localhost:5173)
cd backend && npm run dev     # Backend (http://localhost:3001)
```

### Essential Commands Reference

#### Frontend Commands (Root Directory)
```bash
npm run dev                   # Start Vite dev server (port 5173)
npm run build                 # Production build to dist/
npm run build:dev             # Development build
npm run lint                  # ESLint (max 100 warnings allowed)
npm run type-check            # TypeScript validation
npm run validate              # Run type-check + lint
npm run preview               # Preview production build locally
```

#### Backend Commands (backend/ directory)
```bash
npm run dev                   # Start with hot reload (tsx watch)
npm run build                 # Compile TypeScript to dist/
npm run start                 # Run production server

# Queue/Worker Management
npm run workers:start         # Start ALL workers
npm run workers:message       # Message processor only
npm run workers:campaign      # Campaign worker only
npm run workers:automation    # Automation worker only
npm run queues:monitor        # Bull Board UI (port 3002)
npm run queues:clean          # Clean completed/old jobs
npm run queues:retry-failed   # Retry all failed jobs
npm run queues:test           # Run smoke tests

# Queue Testing Scripts
npm run queues:test-message   # Test message flow
npm run queues:test-automation # Test automation flow
npm run queues:test-campaign  # Test campaign flow

# Database Operations
npm run migration:create      # Create new migration file
npm run migration:run         # Apply pending migrations
npm run seed                  # Seed demo data
npm run simulate:event        # Simulate WhatsApp events
```

---

## 🏗️ Architecture Deep Dive

### System Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                 │
│  Pages → Components → Hooks → Services → Supabase Client    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                     BACKEND (Node.js/Express)               │
│  Routes → Middleware → Services → Workers → Queues          │
└──────────┬────────────────────┬─────────────────────────────┘
           │                    │
    ┌──────▼──────┐      ┌─────▼──────┐      ┌──────────────┐
    │   Supabase  │      │    Redis    │      │   WhatsApp   │
    │  PostgreSQL │      │   (BullMQ)  │      │   (Baileys)  │
    └─────────────┘      └────────────┘      └──────────────┘
```

### Message Processing Flow
```
WhatsApp Message Received
         ↓
    Baileys Event
         ↓
    BullMQ Queue
         ↓
   Message Worker
         ↓
  Owner Detection
    ↙        ↘
Aurora AI   Client AI
    ↓           ↓
Function    Function
Calling     Calling
    ↓           ↓
 Response   Response
    ↘        ↙
  WhatsApp Reply
```

### Directory Structure Breakdown

```
autonomous-paw-actuator-main/
├── src/                      # Frontend source (React)
│   ├── components/           # React components (60+ files)
│   ├── pages/                # Route pages (20+ screens)
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API service layer
│   ├── lib/                  # Utilities (socket, api, supabase)
│   └── integrations/         # Supabase types
│
├── backend/                  # Backend source (Node.js)
│   ├── src/
│   │   ├── config/          # Clients (supabase, redis, openai)
│   │   ├── middleware/      # Auth, tenant, rate-limiting
│   │   ├── routes/          # Express endpoints
│   │   ├── services/        # Business logic (15+ services)
│   │   ├── queue/           # BullMQ setup
│   │   │   ├── workers/    # Message, campaign, automation
│   │   │   ├── jobs/       # Scheduled jobs
│   │   │   └── scripts/    # Testing & maintenance
│   │   ├── types/           # TypeScript definitions
│   │   └── server.ts        # Express + Socket.IO entry
│   │
│   ├── sessions/            # WhatsApp auth persistence
│   └── scripts/             # Admin scripts
│
├── supabase/
│   └── migrations/          # SQL migrations (17 files)
│
└── public/                  # Static assets
```

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

## 📦 Complete Tech Stack Reference

### Backend Stack (backend/)
```json
{
  "runtime": "Node.js 20+ with ESM modules",
  "framework": "Express 4.21+",
  "typescript": "5.8.3 (strict mode)",
  "whatsapp": "@whiskeysockets/baileys 6.7.9",
  "ai": "OpenAI 4.73.1 (GPT-4 with functions)",
  "queue": "BullMQ 5.59 + IORedis 5.8",
  "database": "@supabase/supabase-js 2.58",
  "realtime": "Socket.IO 4.8.1",
  "auth": "JWT + bcrypt",
  "logging": "Pino 9.6 + pino-pretty",
  "dev": "tsx 4.19 (hot reload)"
}
```

### Frontend Stack (src/)
```json
{
  "framework": "React 18.3 + Vite 5.4",
  "ui": "shadcn/ui + Radix UI primitives",
  "styling": "Tailwind CSS 3.4",
  "routing": "React Router DOM 6.30",
  "state": "@tanstack/react-query 5.83",
  "forms": "react-hook-form 7.61 + zod",
  "charts": "Recharts 2.15",
  "calendar": "react-big-calendar 1.19",
  "websocket": "socket.io-client 4.8",
  "notifications": "Sonner 1.7"
}
```

### Infrastructure
- **Hosting**: Render (Web Service + Background Workers)
- **Database**: Supabase (PostgreSQL 15 with RLS)
- **Queue/Cache**: Upstash Redis (Serverless)
- **File Storage**: Supabase Storage
- **Monitoring**: Render Logs + Winston JSON
- **CI/CD**: GitHub Actions + Husky pre-commit

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

## 🗂️ Service Layer Architecture

### Backend Services Map (`backend/src/services/`)

```typescript
// Core WhatsApp Services
baileys/
├── baileys.service.ts         // Multi-tenant WhatsApp management
│   - initializeInstance()     // Pairing code connection
│   - sendMessage()            // Send text/media/audio
│   - getInstanceHealth()      // Connection status
│   └── setSocketEmitter()     // Real-time events

// AI Services
ai/
├── client-ai.service.ts       // Customer-facing AI
│   - processMessage()         // Main AI handler
│   - handleFunctionCall()     // Execute AI functions
│   └── 12+ function implementations

aurora/
├── aurora.service.ts          // Owner AI with full context
│   - processOwnerMessage()    // Owner command handler
│   - getShopContext()         // Aggregate 6+ data sources
│   └── handleHandoff()        // Transfer to Client AI
├── aurora-proactive.service.ts // Proactive messaging
└── aurora-welcome.service.ts   // Onboarding flow

// Business Domain Services
contacts/contacts.service.ts   // Contact management
pets/pets.service.ts           // Pet profiles
bookings/bookings.service.ts   // Appointment system
training/training.service.ts   // Training plans (NEW)
daycare/daycare.service.ts     // Hotel/daycare (NEW)
bipe/bipe.service.ts          // BIPE protocol (NEW)
knowledge-base/               // FAQ system (NEW)

// Support Services
context/context-builder.service.ts  // Dynamic context
esquecidos/vasculhador.service.ts  // Forgotten clients
whatsapp/session-manager.ts        // Auth persistence
admin-auth.service.ts              // Admin authentication
```

### Route Structure (`backend/src/routes/`)

```typescript
// Public Routes
auth.routes.ts                 // Login/register endpoints
whatsapp.routes.ts            // WhatsApp connection APIs

// Protected Routes (require auth)
aurora.routes.ts              // Aurora AI endpoints
conversations.routes.ts       // Message history
contacts.routes.ts           // Contact CRUD
pets.routes.ts              // Pet management
bookings.routes.ts          // Booking operations
training.routes.ts          // Training plans (NEW)
daycare.routes.ts          // Daycare/hotel (NEW)
bipe.routes.ts            // BIPE protocol (NEW)

// Admin Routes (require admin auth)
admin/
├── analytics.routes.ts    // Business metrics
├── clients.routes.ts     // Client management
├── dashboard.routes.ts   // Admin dashboard
├── logs.routes.ts       // System logs
└── monitoring.routes.ts // Health checks
```

### Queue Workers (`backend/src/queue/workers/`)

```typescript
message.worker.ts           // Priority 1: Real-time messages
├── Process incoming WhatsApp messages
├── Route to Aurora or Client AI
└── Handle function calling

campaign.worker.ts         // Priority 2: Bulk campaigns
├── Process campaign batches
├── Track delivery status
└── Handle scheduling

automation.worker.ts      // Priority 3: Automations
├── Execute automation rules
├── Process triggers
└── Send automated messages

vasculhada.worker.ts     // Priority 4: Client recovery
├── Identify forgotten clients
├── Generate recovery messages
└── Track engagement
```

### Middleware Stack (`backend/src/middleware/`)

```typescript
tenant.middleware.ts      // Multi-tenant isolation
├── Extract organizationId from JWT
├── Attach to request context
└── Filter all queries by org

aurora-auth.middleware.ts // Owner authentication
├── Verify owner phone number
└── Grant Aurora access

admin-auth.middleware.ts // Admin panel auth
├── Verify admin role
└── Check permissions

rate-limiter.ts        // API rate limiting
├── Per-endpoint limits
└── Organization-based quotas
```

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

## 🔑 Environment Configuration

### Backend Environment Variables (`backend/.env`)
```bash
# Database (Supabase)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ...                    # Public key
SUPABASE_SERVICE_KEY=eyJ...                 # Admin key (RLS bypass)

# AI Configuration
OPENAI_API_KEY=sk-...                       # GPT-4 access
OPENAI_MODEL=gpt-4-turbo-preview           # Model selection

# Queue System (Redis)
REDIS_URL=redis://default:password@host:port
REDIS_HOST=redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Server Configuration
PORT=3001                                   # Backend port
NODE_ENV=development|production
CORS_ORIGIN=http://localhost:5173          # Frontend URL

# WhatsApp Settings
BAILEYS_LOG_LEVEL=error|warn|info|debug
SESSION_PATH=/app/sessions                 # Render disk path

# Optional Services
SENTRY_DSN=https://...                     # Error tracking
WEBHOOK_SECRET=whsec_...                   # Webhook validation
```

### Frontend Environment Variables (`.env`)
```bash
# API Configuration
VITE_API_URL=http://localhost:3001         # Backend URL
VITE_SOCKET_URL=http://localhost:3001      # WebSocket URL

# Supabase Client
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...       # Anon key only

# Feature Flags (optional)
VITE_ENABLE_AURORA=true
VITE_ENABLE_TRAINING=true
VITE_ENABLE_DAYCARE=true
VITE_ENABLE_BIPE=true
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

## 🔧 Critical Code Patterns

### Multi-Tenant Data Access Pattern
```typescript
// ALWAYS use TenantAwareSupabase for data access
import { TenantAwareSupabase } from '../config/supabase';

async function getContactsByOrg(organizationId: string) {
  const supabase = new TenantAwareSupabase(organizationId);

  // Automatically filtered by organization_id
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  return data;
}
```

### Queue Job Pattern
```typescript
// Adding jobs to queue with retry logic
await messageQueue.add(
  'process-message',
  {
    organizationId,
    instanceId,
    from: message.key.remoteJid,
    content: message.message.conversation
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
);
```

### AI Function Calling Pattern
```typescript
// Define function for OpenAI
const tools = [{
  type: 'function',
  function: {
    name: 'criar_agendamento',
    description: 'Criar novo agendamento',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string' },
        serviceId: { type: 'string' },
        scheduledAt: { type: 'string' }
      },
      required: ['petId', 'serviceId', 'scheduledAt']
    }
  }
}];

// Handle function call
if (response.tool_calls) {
  for (const tool of response.tool_calls) {
    const result = await handleFunctionCall(
      tool.function.name,
      JSON.parse(tool.function.arguments)
    );
  }
}
```

### WebSocket Event Pattern
```typescript
// Emit real-time updates
io.to(`org:${organizationId}`).emit('message:received', {
  conversationId,
  message: {
    id: messageId,
    content,
    from,
    timestamp: new Date().toISOString()
  }
});
```

## 🐛 Common Issues & Solutions

### WhatsApp Connection Issues
```bash
# Check connection status
curl http://localhost:3001/api/v1/whatsapp/health

# Clear session and reconnect
rm -rf backend/sessions/[org_id]_[instance_id]
# Restart backend to trigger new pairing code
```

### Queue Processing Stuck
```bash
# Monitor queue status
cd backend && npm run queues:monitor
# Access Bull Board at http://localhost:3002

# Clean stuck jobs
npm run queues:clean

# Retry failed jobs
npm run queues:retry-failed
```

### Database Migration Issues
```sql
-- Check current migration status
SELECT * FROM supabase_migrations ORDER BY version DESC;

-- Manually mark migration as complete if needed
INSERT INTO supabase_migrations (version, name, executed_at)
VALUES ('20251003', 'migration_name', NOW());
```

### Multi-Tenant Data Leak
```typescript
// WRONG - No organization filter
const { data } = await supabase.from('contacts').select('*');

// CORRECT - Always filter by organization
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', organizationId);
```

## 📊 Performance Optimization Checklist

### Database Indexes (Required)
```sql
-- Multi-tenant queries
CREATE INDEX idx_[table]_org_created
  ON [table](organization_id, created_at DESC);

-- Frequent lookups
CREATE INDEX idx_messages_conversation
  ON messages(conversation_id, created_at DESC);

-- WhatsApp number lookup
CREATE INDEX idx_contacts_phone
  ON contacts(phone_number) WHERE deleted_at IS NULL;
```

### Query Optimization
- Always use `LIMIT` for list queries
- Use `select()` with specific columns, not `*`
- Implement cursor-based pagination for large datasets
- Cache frequent queries with Redis

### Frontend Performance
- Lazy load routes with React.lazy()
- Use React Query for server state caching
- Implement virtual scrolling for long lists
- Optimize bundle size with dynamic imports

## 🚦 Testing Strategy

### Unit Tests (Services)
```bash
cd backend
npm test                     # Run all tests
npm test -- --watch         # Watch mode
npm test -- services/aurora # Test specific service
```

### Integration Tests (API)
```bash
# Test API endpoints
cd backend
npm run test:integration

# Test queue processing
npm run queues:test
```

### E2E Tests (User Flows)
```bash
# Playwright tests (when implemented)
npx playwright test
npx playwright test --ui    # Interactive mode
```

## 📝 Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Emergency fixes

### Commit Convention
```bash
feat(scope): Add new feature
fix(scope): Fix bug
docs(scope): Update documentation
style(scope): Format code
refactor(scope): Refactor code
test(scope): Add tests
chore(scope): Update dependencies
```

### Pre-commit Checks
- ESLint validation (max 100 warnings)
- TypeScript type checking
- Prettier formatting
- Unit test execution

---

## 🎓 Key Architectural Decisions

1. **Baileys over Official API**: Native WhatsApp protocol for cost efficiency
2. **BullMQ over Direct Processing**: Resilient async message handling
3. **Supabase over Custom Backend**: Rapid development with built-in auth/storage
4. **Multi-tenant RLS**: Security at database level, not application
5. **Dual AI System**: Separate contexts for owners vs customers
6. **Function Calling over Text Parsing**: Structured AI actions
7. **Pairing Code over QR**: Better UX for WhatsApp connection
8. **Redis Queue over Database Queue**: Performance for high-volume messaging
9. **Socket.IO + Supabase Realtime**: Dual real-time strategy
10. **TypeScript Everywhere**: Type safety across full stack

---

*This CLAUDE.md is the single source of truth for Claude Code working on AuZap. Updated October 2025 with comprehensive architecture details.*
- Quero sempre que vc ao finalizar a implantação de uma feature, ao inves de me dar o link para acessar, vc vai entrar com o playwright e fazer todo o percurso, validar tudo e trazer o resultado após essa validação de navegação.
- sempre faça o git no final da validação da ferramenta.... pusha ele e se lembre q tem q passar nas validações.
- VITE_API_URL=https://auzap-backend-8xyx.onrender.com
VITE_SUPABASE_PROJECT_ID=cdndnwglcieylfgzbwts
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU1NzMsImV4cCI6MjA3NDk0MTU3M30.BwvlhpRijTbdofpU06mH84-SjOWH9GFr9tzEpuN1DUM
VITE_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
- esse é o site da front auzap-frontend-d84c.onrender.com
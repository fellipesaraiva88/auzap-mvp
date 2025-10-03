---
tags: [indice, hub, navegacao, cerebro]
created: 2025-10-03
type: hub-central
status: active
---

# 🧠 AuZap - Segundo Cérebro

> **SaaS multi-tenant de automação WhatsApp para petshops/veterinárias**  
> Dual AI System: Aurora (owner) + Cliente (customer)

## 🎯 O Que É Este Cérebro?

Este é um **segundo cérebro vivo** do projeto AuZap, estruturado em **14 camadas conceituais** que vão desde a filosofia até comandos práticos. Cada nota está hiperconectada para criar uma **rede neural de conhecimento**.

**Status Atual**: Oct 2025 - Production-Ready MVP com Aurora Enhanced

---

## 🗺️ Navegação por Camada

### 1️⃣ [[1-VISAO-E-FILOSOFIA/Visao-AuZap|🎯 Visão & Filosofia]]
- Por que o AuZap existe
- Princípio "Impacto > Atividade"
- Filosofia do Dual AI System
- Abordagem cognitiva nível 4-5

### 2️⃣ [[2-ARQUITETURA-SISTEMICA/Sistema-Completo|🏗️ Arquitetura Sistêmica]]
- Visão 360° do sistema
- Message Flow (WhatsApp → AI → Response)
- Multi-tenancy com RLS
- Real-time strategy (Socket.IO + Supabase)

### 3️⃣ [[3-DATABASE-E-DADOS/Schema-Overview|🗄️ Database & Dados]]
- 19 tabelas multi-tenant
- RLS Policies (security)
- Indexes otimizados (<50ms queries)
- Migrations timeline

### 4️⃣ [[4-AI-SERVICES/Aurora-Service|🤖 AI Services]]
- Aurora: Owner AI com 6+ data sources
- Client AI: Customer-facing automation
- Function Calling (12+ funções)
- AI Handoff (Aurora → Cliente)

### 5️⃣ [[5-WORKERS-E-QUEUES/BullMQ-Architecture|⚙️ Workers & Queues]]
- BullMQ + Redis architecture
- Message Worker (Priority 1)
- Campaign/Automation workers
- Queue management commands

### 6️⃣ [[6-FEATURES-E-VERTICAIS/Training-Plans|📦 Features & Verticais]]
- Training Plans (adestramento)
- Daycare/Hotel (hospedagem)
- BIPE Protocol (health tracking)
- Knowledge Base (FAQ)
- Clientes Esquecidos (recovery)

### 7️⃣ [[7-INTEGRACAO-WHATSAPP/Baileys-Service|🔌 Integração WhatsApp]]
- Baileys Service (native protocol)
- Pairing Code flow (não QR)
- Session management
- Owner detection logic

### 8️⃣ [[8-DEPLOY-E-INFRA/Render-Setup|🚀 Deploy & Infraestrutura]]
- Render: Web Service + Workers
- Environment variables
- Health checks (/health)
- Rollback strategy

### 9️⃣ [[9-COMANDOS-E-SCRIPTS/Frontend-Commands|🔧 Comandos & Scripts]]
- Frontend commands (npm run...)
- Backend commands (workers, queues)
- Admin scripts
- Debug workflows

### 🔟 [[10-MONITORING-E-OPS/Bull-Board|📊 Monitoring & Ops]]
- Bull Board (queue monitoring)
- Winston logging (structured)
- Performance targets
- Common issues & solutions

### 1️⃣1️⃣ [[11-PATTERNS-E-BEST-PRACTICES/Multi-Tenant-Pattern|📚 Patterns & Best Practices]]
- Multi-tenant data access
- Queue job pattern
- AI function calling
- Service layer organization

### 1️⃣2️⃣ [[12-DECISOES-ARQUITETURAIS/Por-Que-Baileys|🎓 Decisões Arquiteturais]]
- Por que Baileys? (vs Official API)
- Por que BullMQ? (vs Direct)
- Por que Multi-tenant RLS?
- Por que Dual AI System?

### 1️⃣3️⃣ [[13-NOTION-SYNC/Arquitetura-Completa-v2|🔗 Notion Sync]]
- Links para páginas Notion
- Resumos sincronizados
- Andamento da Auzap (write-enabled)

### 1️⃣4️⃣ [[14-QUICK-REFERENCE/API-Endpoints|⚡ Quick Reference]]
- API endpoints completos
- Database ERD visual
- Message flow diagram
- Glossário de termos

---

## 🔥 Status do Sistema

| Componente | Status | Notas |
|------------|--------|-------|
| **Frontend** | ✅ LIVE | Render - auzap-frontend.onrender.com |
| **Backend** | ⚠️ Fixes | Build issues pendentes |
| **Aurora AI** | ✅ Operational | 6+ data sources, full context |
| **Client AI** | ✅ Operational | 12+ functions, handoff ready |
| **WhatsApp** | ⏳ Testing | Pairing code validation |
| **Database** | ✅ Production | 19 tables + RLS + indexes |
| **Queues** | ✅ Operational | BullMQ + Redis |
| **New Verticals** | ✅ Implemented | Training, Daycare, BIPE, KB |

---

## ⚡ Quick Access (Atalhos Rápidos)

### Para Desenvolvedores
- [[9-COMANDOS-E-SCRIPTS/Frontend-Commands|Frontend Commands]] - `npm run dev/build/lint`
- [[9-COMANDOS-E-SCRIPTS/Backend-Commands|Backend Commands]] - `npm run workers:start`
- [[10-MONITORING-E-OPS/Common-Issues|Common Issues]] - Troubleshooting guide
- [[9-COMANDOS-E-SCRIPTS/Git-Workflow|Git Workflow]] - Branches, commits, deploy

### Para Arquitetos
- [[2-ARQUITETURA-SISTEMICA/Message-Flow|Message Flow]] - Fluxo completo com diagrama
- [[3-DATABASE-E-DADOS/Schema-Overview|Database Schema]] - 19 tabelas overview
- [[14-QUICK-REFERENCE/Database-ERD|Database ERD]] - Diagrama visual
- [[12-DECISOES-ARQUITETURAIS/Por-Que-Dual-AI|Decisões Arquiteturais]] - Por quês

### Para Product/Business
- [[1-VISAO-E-FILOSOFIA/Visao-AuZap|Visão AuZap]] - O que é, por que existe
- [[1-VISAO-E-FILOSOFIA/Principio-Impacto-Maior-Atividade|Impacto > Atividade]] - UX principle
- [[6-FEATURES-E-VERTICAIS/Clientes-Esquecidos|Clientes Esquecidos]] - Recovery feature
- [[4-AI-SERVICES/Aurora-Service|Aurora Service]] - Owner AI capabilities

### Para DevOps
- [[8-DEPLOY-E-INFRA/Render-Setup|Render Setup]] - Deploy configuration
- [[8-DEPLOY-E-INFRA/Health-Checks|Health Checks]] - Monitoring endpoints
- [[10-MONITORING-E-OPS/Performance-Targets|Performance Targets]] - SLAs
- [[8-DEPLOY-E-INFRA/Rollback-Strategy|Rollback Strategy]] - Disaster recovery

---

## 🎨 Como Usar Este Cérebro

### No Obsidian Graph Mode
1. **Abra Graph View** - Veja todas as conexões
2. **Use filtros de tags** - Filtre por camada ou status
3. **Clique em nós** - Navegue pelas conexões
4. **Zoom em clusters** - Explore áreas específicas

### Tags para Filtrar
```
#visao #filosofia #principio
#arquitetura #sistema #fluxo
#database #schema #rls #migration
#aurora #cliente-ai #worker #queue
#training #daycare #bipe #kb
#codigo #pattern #service
#deploy #monitoring #security
```

### Níveis de Profundidade
- **Camada 1-2**: Conceitos e visão (o "porquê")
- **Camada 3-7**: Implementação técnica (o "como")
- **Camada 8-10**: Operação e deploy (o "manter vivo")
- **Camada 11-14**: Referência e decisões (o "contexto")

---

## 🌟 Filosofia Deste Cérebro

> **"Um segundo cérebro não é um arquivo morto - é uma rede neural viva que cresce com o projeto."**

### Princípios
1. **Hiperconexão**: Cada nota conecta a 3-5 outras
2. **Contexto Rico**: Frontmatter com metadata completo
3. **Visual First**: Diagramas, emojis, callouts
4. **Evolutivo**: Cresce com novas features
5. **Prático**: Sempre linkado ao código real

---

## 📊 Métricas do Cérebro

- **Total de Notas**: ~70 arquivos markdown
- **Total de Tags**: ~50 tags únicas
- **Profundidade**: 14 camadas conceituais
- **Conexões**: ~300+ links internos
- **Diagramas**: 5+ mermaid diagrams
- **Última Atualização**: 2025-10-03

---

## 🔗 Links Externos Importantes

- [Notion: Work Space Pangeia](https://www.notion.so/Andamento-da-Auzap-280a53b3e53c80198311c3e3c9b0c6bd)
- [Render Dashboard](https://dashboard.render.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Frontend LIVE](https://auzap-frontend.onrender.com)
- [Backend API](https://auzap-api.onrender.com/health)

---

## 🎯 Próximos Passos (Roadmap)

### Fase 3: Proativo (Nov 2025)
- [ ] Proactive message workers
- [ ] Daily summary automation (18h)
- [ ] Opportunity detection
- [ ] Campaign automation

### Fase 4: Scale (Dez 2025)
- [ ] Beta petshop onboarding
- [ ] Performance optimization
- [ ] Advanced analytics
- [ ] Mobile app MVP

---

**🧠 Este cérebro está vivo. Explore, conecte, evolua.**

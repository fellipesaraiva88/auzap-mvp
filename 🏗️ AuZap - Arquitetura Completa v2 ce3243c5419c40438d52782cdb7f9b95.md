# 🏗️ AuZap - Arquitetura Completa v2

# AuZap - Arquitetura Completa v2

**Sistema:** WhatsApp Automation + Dupla Camada de IA (Cliente + Aurora)

**Status:** ✅ Documentação completa e definitiva

---

## 🎯 Visão Geral

### Dois Agentes de IA Independentes:

**1️⃣ Agente Cliente** - Atende clientes finais

- Cadastra pets automaticamente via conversa
- Agenda consultas, banhos, hotel
- Responde dúvidas sobre serviços
- Envia lembretes e follow-ups
- Escala para humano quando necessário

**2️⃣ Aurora (Agente Dono)** - Parceiro de negócios do dono

- **Reconhece números autorizados** dos donos
- Fornece analytics conversacional em tempo real
- Automatiza campanhas de marketing
- Preenche agenda proativamente
- Envia resumos diários e insights
- Identifica oportunidades (feriados, clientes inativos)

---

## 📊 Fluxo do Sistema

```mermaid
WhatsApp Message Received
    ↓
Baileys detecta número remetente
    ↓
    ┌─────────────────────┐
    │ É número de dono?   │
    └─────────────────────┘
           ↙        ↘
        SIM          NÃO
         ↓            ↓
    AURORA      AGENTE CLIENTE
         ↓            ↓
    Analytics    Cadastro Pet
    Automações   Agendamento
    Insights     Dúvidas
         ↓            ↓
    Responde     Responde
     Dono        Cliente
```

---

## 🗄️ Estrutura de Banco (15 tabelas)

### Core (6 tabelas)

1. `organizations` - Empresas/petshops cadastrados
2. `users` - Usuários do sistema (staff)
3. `organization_settings` - Configurações de IA e automações
4. `whatsapp_instances` - Conexões WhatsApp (Baileys)
5. `services` - Serviços oferecidos
6. **`authorized_owner_numbers`** 🆕 - Números dos donos autorizados

### Clientes & Pets (3 tabelas)

1. `contacts` - Clientes/tutores
2. `pets` - Pets cadastrados
3. `bookings` - Agendamentos (consulta/hotel/daycare)

### WhatsApp & IA Cliente (4 tabelas)

1. `conversations` - Conversas com clientes
2. `messages` - Mensagens trocadas
3. `ai_interactions` - Logs da IA cliente
4. `scheduled_followups` - Follow-ups automáticos

### Aurora (2 tabelas) 🆕

1. **`aurora_proactive_messages`** - Mensagens proativas para donos
2. **`aurora_automations`** - Automações configuradas

---

## 🏗️ Arquitetura Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.ts
│   │   ├── openai.ts
│   │   └── redis.ts
│   │
│   ├── services/
│   │   ├── baileys.service.ts       # WhatsApp Baileys
│   │   ├── ai.service.ts            # IA Cliente (OpenAI)
│   │   ├── aurora.service.ts        # IA Aurora (OpenAI) 🆕
│   │   ├── contacts.service.ts
│   │   ├── pets.service.ts
│   │   ├── bookings.service.ts
│   │   └── followups.service.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── tenant.middleware.ts
│   │   └── aurora-auth.middleware.ts  # Detecta donos 🆕
│   │
│   ├── workers/
│   │   ├── message-processor.ts       # Processa msgs cliente
│   │   ├── aurora-proactive.ts        # Msgs proativas Aurora 🆕
│   │   └── followup-scheduler.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── whatsapp.routes.ts
│   │   ├── aurora.routes.ts           # Endpoints Aurora 🆕
│   │   ├── contacts.routes.ts
│   │   └── bookings.routes.ts
│   │
│   └── server.ts
│
└── package.json
```

---

## 🔄 Fluxo de Mensagens

### 1. Cliente envia mensagem

```tsx
// WhatsApp → Baileys → BullMQ Queue

Baileys.on('messages.upsert', async (msg) => {
  await messageQueue.add('process-message', {
    organizationId,
    instanceId,
    from: msg.key.remoteJid,
    content: msg.message.conversation
  });
});
```

### 2. Worker processa mensagem

```tsx
// Worker detecta se é dono ou cliente

const isOwner = await checkOwnerNumber(from, organizationId);

if (isOwner) {
  // Processar com Aurora
  const response = await AuroraService.processOwnerMessage({
    organizationId,
    content,
    context: ownerContext
  });
} else {
  // Processar com IA Cliente
  const response = await AIService.processClientMessage({
    organizationId,
    contactId,
    content
  });
}

// Enviar resposta via Baileys
await BaileysService.sendTextMessage(from, response);
```

---

## 🎨 Tech Stack

### Backend

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **WhatsApp:** @whiskeysockets/baileys (nativo)
- **IA:** OpenAI GPT-4 + Function Calling
- **Database:** Supabase (PostgreSQL + RLS)
- **Queue:** BullMQ + Redis
- **Real-time:** [Socket.io](http://Socket.io)

### Frontend

- **Framework:** React 18 + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **State:** TanStack Query
- **Auth:** Supabase Auth
- **Real-time:** [Socket.io](http://Socket.io)-client

### Infraestrutura

- **Deploy:** Render (web service + worker)
- **Database:** Supabase Cloud
- **Cache:** Redis (Upstash)
- **Storage:** Supabase Storage

---

## 📱 Features Principais

### Para Clientes

✅ Cadastro automático de pets via WhatsApp

✅ Agendamento conversacional

✅ Lembretes automáticos

✅ Consulta de horários disponíveis

✅ Cancelamento/reagendamento

✅ Histórico de serviços

### Para Donos (Aurora)

✅ "Quantos banhos fizemos essa semana?"

✅ "Preenche a agenda da próxima semana"

✅ "Quais clientes estão inativos?"

✅ Resumo diário automático (18h)

✅ Alertas de oportunidades (feriados)

✅ Campanhas automáticas de reativação

✅ Comemoração de metas batidas

---

## 🚀 Roadmap de Implementação

### Fase 1: MVP Core (Semana 1-2) ✅

- [x]  Setup Supabase + migrations
- [x]  BaileysService com pairing code
- [x]  IA Cliente básica
- [x]  CRUD contatos/pets/bookings
- [ ]  Dashboard básico

### Fase 2: Aurora (Semana 3) 🚧

- [ ]  Aurora Service + Function Calling
- [ ]  Middleware de detecção de donos
- [ ]  Analytics conversacional
- [ ]  Automação de agenda

### Fase 3: Proativo (Semana 4)

- [ ]  Worker de mensagens proativas
- [ ]  Resumos diários
- [ ]  Alertas de oportunidades
- [ ]  Campanhas automáticas

### Fase 4: Scale (Semana 5+)

- [ ]  Multi-instância Baileys
- [ ]  Load balancing
- [ ]  Monitoring completo
- [ ]  E2E tests

---

## 📚 Documentação Técnica

Todas as páginas abaixo contêm código completo pronto para produção:

1. **Setup Completo** - Guia de instalação end-to-end
2. **Schema SQL** - Todas as 15 tabelas + RLS
3. **BaileysService** - Código completo com pairing code
4. **Aurora Service** - IA parceira com function calling
5. **Baileys Features** - Todas as capacidades (botões, listas, mídia)
6. **Message Processor** - Worker com roteamento

---

**Sistema completo com dupla camada de IA: uma para clientes, outra para o dono! 🤝✨**

[1️⃣ Setup Completo - Instalação](%F0%9F%8F%97%EF%B8%8F%20AuZap%20-%20Arquitetura%20Completa%20v2%20ce3243c5419c40438d52782cdb7f9b95/1%EF%B8%8F%E2%83%A3%20Setup%20Completo%20-%20Instala%C3%A7%C3%A3o%207b3029e13cab4a5ebcb6e8e977e8e462.md)

[2️⃣ Schema SQL Completo](%F0%9F%8F%97%EF%B8%8F%20AuZap%20-%20Arquitetura%20Completa%20v2%20ce3243c5419c40438d52782cdb7f9b95/2%EF%B8%8F%E2%83%A3%20Schema%20SQL%20Completo%2046fb93e581ba4a1cbccabb307f92c37e.md)

[3️⃣ BaileysService Completo](%F0%9F%8F%97%EF%B8%8F%20AuZap%20-%20Arquitetura%20Completa%20v2%20ce3243c5419c40438d52782cdb7f9b95/3%EF%B8%8F%E2%83%A3%20BaileysService%20Completo%20d90bd54992ea445e9e87b484c348b09f.md)

[4️⃣ Aurora Service Completo](%F0%9F%8F%97%EF%B8%8F%20AuZap%20-%20Arquitetura%20Completa%20v2%20ce3243c5419c40438d52782cdb7f9b95/4%EF%B8%8F%E2%83%A3%20Aurora%20Service%20Completo%205c3feff161454b3b833afc0fca155726.md)

[5️⃣ Message Processor Worker](%F0%9F%8F%97%EF%B8%8F%20AuZap%20-%20Arquitetura%20Completa%20v2%20ce3243c5419c40438d52782cdb7f9b95/5%EF%B8%8F%E2%83%A3%20Message%20Processor%20Worker%201adb6196e0254b21a221d370b768d889.md)

[📋 Resumo Executivo](%F0%9F%8F%97%EF%B8%8F%20AuZap%20-%20Arquitetura%20Completa%20v2%20ce3243c5419c40438d52782cdb7f9b95/%F0%9F%93%8B%20Resumo%20Executivo%20f51bfcd7de2a4d938c28cf137981ebb8.md)

[6️⃣ Dashboard AuZap - UX Completo](%F0%9F%8F%97%EF%B8%8F%20AuZap%20-%20Arquitetura%20Completa%20v2%20ce3243c5419c40438d52782cdb7f9b95/6%EF%B8%8F%E2%83%A3%20Dashboard%20AuZap%20-%20UX%20Completo%20138a9a71f6a64172a46858d4932797cf.md)
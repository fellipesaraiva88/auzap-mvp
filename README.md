# 🐾 AuZap - WhatsApp Automation com Dupla IA

Sistema SaaS completo de automação WhatsApp para petshops e clínicas veterinárias com **dois agentes de IA independentes**:

- **IA Cliente**: Atende clientes finais via WhatsApp
- **Aurora**: Parceira de negócios do dono via WhatsApp

---

## 🎯 Status do Projeto

✅ **Banco de Dados**: 15 tabelas criadas com RLS  
✅ **Backend**: API Express + Baileys + OpenAI + Workers  
✅ **Frontend**: React + Vite + Tailwind + shadcn/ui  
⏳ **Deploy**: Pendente (Render + Upstash Redis)  

---

## 🚀 Quick Start

### 1. Clonar Repositório

```bash
git clone <seu-repo>
cd final_auzap
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Copiar .env.example para .env
cp .env.example .env

# Editar .env com suas credenciais
# SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
# OPENAI_API_KEY=sua_openai_key
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install

# Copiar .env.example para .env
cp .env.example .env

# Editar .env
# VITE_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
# VITE_SUPABASE_ANON_KEY=sua_anon_key
# VITE_API_URL=http://localhost:3000
```

### 4. Rodar Redis (Docker)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 5. Iniciar Desenvolvimento

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Worker:**
```bash
cd backend
npm run worker
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

---

## 📊 Banco de Dados Supabase

**Projeto**: auzap  
**URL**: https://cdndnwglcieylfgzbwts.supabase.co  
**Região**: us-east-2  

### Tabelas Criadas (15)

**Core (6)**
- organizations
- users  
- organization_settings
- whatsapp_instances
- services
- authorized_owner_numbers

**Clientes & Pets (3)**
- contacts
- pets
- bookings

**IA Cliente (4)**
- conversations
- messages
- ai_interactions
- scheduled_followups

**Aurora (2)**
- aurora_proactive_messages
- aurora_automations

---

## 🛠️ Stack Tecnológica

### Backend
- Node.js 20+
- Express.js + TypeScript
- @whiskeysockets/baileys (WhatsApp)
- OpenAI SDK (GPT-4o)
- @supabase/supabase-js
- BullMQ + ioredis
- Socket.io
- Pino (logging)

### Frontend
- React 18 + Vite
- TypeScript
- Tailwind CSS + shadcn/ui
- @tanstack/react-query
- Zustand (state)
- Socket.io-client

### Infraestrutura
- Supabase Cloud (Database + Auth)
- Redis (local dev / Upstash prod)
- Render (deploy - pendente)

---

## 📁 Estrutura do Projeto

```
final_auzap/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase, OpenAI, Redis, Logger
│   │   ├── types/           # TypeScript types
│   │   ├── middleware/      # Aurora auth detection
│   │   ├── routes/          # API routes (whatsapp, webhook)
│   │   ├── services/        # Baileys, Aurora, ClientAI
│   │   ├── workers/         # Message processor
│   │   └── index.ts         # Server entry
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Dashboard, Login
│   │   ├── lib/             # Supabase, Socket.io
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   ├── store/           # Zustand stores
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── PLANO_COMPLETO_IMPLEMENTACAO.md
└── README.md
```

---

## 🔑 Credenciais Supabase

**URL**: `https://cdndnwglcieylfgzbwts.supabase.co`

**Anon Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU1NzMsImV4cCI6MjA3NDk0MTU3M30.BwvlhpRijTbdofpU06mH84-SjOWH9GFr9tzEpuN1DUM
```

**Service Role Key**: (em .env.example)

---

## 🎮 Como Usar

### 1. Conectar WhatsApp

```bash
POST /api/whatsapp/instances/:id/connect
{
  "phone_number": "5511999999999",
  "method": "code"
}

# Retorna pairing code de 8 dígitos
# Conectar no WhatsApp: Aparelhos conectados > Conectar aparelho > Digitar código
```

### 2. Testar IA Cliente

Envie mensagem WhatsApp para o número conectado:
```
"Oi, gostaria de agendar um banho para meu cachorro Rex"
```

A IA irá:
- Cadastrar o pet automaticamente
- Verificar horários disponíveis
- Agendar o serviço

### 3. Testar Aurora (IA do Dono)

1. Cadastrar seu número como dono autorizado:
```sql
INSERT INTO authorized_owner_numbers (organization_id, phone_number, label)
VALUES ('org-id', '5511888888888', 'Dono Principal');
```

2. Enviar mensagem do número cadastrado:
```
"Quantos banhos fizemos essa semana?"
```

Aurora irá responder com analytics em tempo real.

---

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm run test
```

---

## 📦 Deploy (Próximos Passos)

### 1. Upstash Redis

1. Criar conta em upstash.com
2. Criar Redis database
3. Copiar REDIS_URL
4. Atualizar .env production

### 2. Render

**Backend (Web Service + Worker):**

```yaml
# render.yaml
services:
  - type: web
    name: auzap-api
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    
  - type: worker
    name: auzap-worker
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm run worker
```

**Frontend (Static Site):**
```bash
cd frontend
npm run build
# Deploy pasta dist/ no Render Static Site
```

---

## 🔒 Segurança

- ✅ RLS (Row Level Security) habilitado em todas as tabelas
- ✅ Service role key apenas no backend
- ✅ HTTPS obrigatório em produção
- ✅ Validação de tokens JWT
- ✅ Rate limiting (implementar)

---

## 📚 Documentação Completa

Ver arquivos na pasta raiz:
- `PLANO_COMPLETO_IMPLEMENTACAO.md` - Plano de 8 fases
- `🏗️ AuZap - Arquitetura Completa v2/` - Docs técnicos detalhados

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase credentials"
- Verificar .env configurado corretamente
- Checar se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidos

### Erro: "Redis connection failed"
- Verificar se Redis está rodando: `docker ps`
- Rodar: `docker run -d -p 6379:6379 redis:7-alpine`

### Erro: "OpenAI API key invalid"
- Verificar se OPENAI_API_KEY está correto
- Checar créditos em platform.openai.com

---

## 🎯 Próximos Passos

1. ✅ Completar estrutura base
2. ⏳ Implementar mais componentes frontend
3. ⏳ Adicionar testes E2E
4. ⏳ Deploy em staging
5. ⏳ Teste beta com clientes reais

---

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ por Fellipe Saraiva + Claude Code**  
**Data**: 01/10/2025

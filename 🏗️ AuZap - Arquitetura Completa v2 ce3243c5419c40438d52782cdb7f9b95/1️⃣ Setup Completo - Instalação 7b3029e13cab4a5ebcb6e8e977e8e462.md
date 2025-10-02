# 1️⃣ Setup Completo - Instalação

# Setup Completo - Instalação do AuZap

**Objetivo:** Sair do zero para o sistema rodando em menos de 1 hora

---

## 📝 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Conta no OpenAI com créditos
- Docker (para Redis local) OU conta Upstash

---

## 🔑 Credenciais Supabase

**SUPABASE_URL:** [https://cdndnwglcieylfgzbwts.supabase.co](https://cdndnwglcieylfgzbwts.supabase.co)

**SUPABASE_ANON_KEY:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU1NzMsImV4cCI6MjA3NDk0MTU3M30.BwvlhpRijTbdofpU06mH84-SjOWH9GFr9tzEpuN1DUM

**SUPABASE_SERVICE_ROLE_KEY:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg

**JWT Secret:** eEFahBFj9+vmYhLIqtOQnAyuRCKNiEPwwkm9b4zKrJHD9zSC/erjOOVydgOnC0dICo7HIENf0WtBB5ooYaez6w==

## 1️⃣ Criar Projeto Supabase

### Passo 1: Criar projeto

1. Acesse [supabase.com](http://supabase.com)
2. Crie novo projeto
3. Anote: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Passo 2: Executar migrations

Copie e execute no **SQL Editor** do Supabase (em ordem):

**Migration 1: Schema Principal**

```sql
-- Ver página "2️⃣ Schema SQL Completo"
-- Copiar e executar 00001_initial_schema.sql
```

**Migration 2: RLS Policies**

```sql
-- Ver página "2️⃣ Schema SQL Completo"
-- Copiar e executar 00002_rls_policies.sql
```

**Migration 3: Tabelas Aurora**

```sql
-- Ver página "2️⃣ Schema SQL Completo"
-- Copiar e executar 00003_aurora_tables.sql
```

---

## 2️⃣ Criar Conta OpenAI

1. Acesse [platform.openai.com](http://platform.openai.com)
2. Crie conta e adicione créditos (mínimo $5)
3. Gere API Key
4. Anote: `OPENAI_API_KEY`

---

## 3️⃣ Setup Redis

### Opção A: Local (Desenvolvimento)

**docker-compose.yml:**

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
volumes:
  redis_data:
```

Rodar:

```bash
docker-compose up -d
```

### Opção B: Upstash (Produção)

1. Acesse [upstash.com](http://upstash.com)
2. Crie Redis database
3. Anote: `REDIS_URL` (formato: `redis://...:port`)

---

## 4️⃣ Setup Backend

### Instalar dependências

```bash
mkdir auzap && cd auzap
mkdir backend && cd backend
npm init -y

# Core
npm install express cors dotenv
npm install typescript tsx @types/node @types/express @types/cors

# Supabase
npm install @supabase/supabase-js

# WhatsApp Baileys
npm install @whiskeysockets/baileys @hapi/boom pino
npm install qrcode-terminal  # Para QR no terminal (dev)

# OpenAI
npm install openai

# Queue
npm install bullmq ioredis

# Real-time
npm install [socket.io](http://socket.io)
```

### Criar estrutura de pastas

```bash
mkdir -p src/{config,services,middleware,workers,routes,types}
touch src/server.ts
```

### Arquivo `.env`

```bash
# Supabase
SUPABASE_URL=[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Redis
REDIS_HOST=[localhost](http://localhost)
REDIS_PORT=6379
# OU se usar Upstash:
# REDIS_URL=redis://...

# Server
PORT=3000
NODE_ENV=development
```

### TypeScript config

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Scripts package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:types": "npx supabase gen types typescript --project-id SEU-PROJECT-ID > src/types/database.types.ts"
  }
}
```

---

## 5️⃣ Implementar Services

### 5.1 Supabase Client

**src/config/supabase.ts:**

```tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### 5.2 OpenAI Client

**src/config/openai.ts:**

```tsx
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});
```

### 5.3 Redis & BullMQ

**src/config/redis.ts:**

```tsx
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

const redisConnection = {
  host: process.env.REDIS_HOST || '[localhost](http://localhost)',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
};

export const messageQueue = new Queue('messages', {
  connection: redisConnection,
});

export const redis = new Redis(redisConnection);
```

### 5.4 BaileysService

**Ver página "3️⃣ BaileysService Completo"** para código completo

### 5.5 Aurora Service

**Ver página "4️⃣ Aurora Service Completo"** para código completo

---

## 6️⃣ Server Principal

**src/server.ts:**

```tsx
import express from 'express';
import cors from 'cors';
import { BaileysService } from './services/baileys.service';
import whatsappRoutes from './routes/whatsapp.routes';
import auroraRoutes from './routes/aurora.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/aurora', auroraRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Inicializar instâncias Baileys do banco
  console.log('🔄 Initializing Baileys instances...');
  await BaileysService.initializeAllInstances();
  console.log('✅ Baileys instances ready');
});
```

---

## 7️⃣ Workers

### Message Processor

**Ver página "6️⃣ Message Processor Worker"** para código completo

Rodar em terminal separado:

```bash
npm run worker
```

---

## 8️⃣ Testar

### 1. Iniciar servidor

```bash
npm run dev
```

### 2. Conectar WhatsApp

**Via API:**

```bash
curl -X POST [http://localhost:3000/api/whatsapp/instances/test/init](http://localhost:3000/api/whatsapp/instances/test/init) \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "5511999999999",
    "method": "code"
  }'
```

Retorna:

```json
{
  "success": true,
  "pairingCode": "AB12-CD34",
  "method": "code"
}
```

### 3. Digitar código no WhatsApp

1. Abra WhatsApp no celular
2. Vá em: **Configurações** → **Aparelhos conectados**
3. Clique em **Conectar um aparelho**
4. Escolha **Digitar código manualmente**
5. Digite: `AB12CD34`
6. Aguarde conexão

### 4. Enviar mensagem de teste

Envie mensagem do seu celular para o número conectado:

```
Olá! Quero agendar um banho para meu cachorro
```

A IA deve responder automaticamente! ✅

---

## 9️⃣ Cadastrar Número do Dono (Aurora)

**SQL:**

```sql
INSERT INTO authorized_owner_numbers (
  organization_id,
  phone_number,
  nickname,
  permissions
) VALUES (
  'sua-org-uuid',  -- Pegar da tabela organizations
  '5511999999999',  -- Seu número pessoal
  'Fellipe Saraiva - Dono',
  '{
    "view_analytics": true,
    "automate_bookings": true,
    "contact_clients": true,
    "view_financials": true,
    "manage_staff": true
  }'::jsonb
);
```

Agora envie mensagem do seu número pessoal:

```
Quantos banhos fizemos essa semana?
```

Aurora deve responder com analytics! 🎉

---

## ✅ Checklist Final

- [ ]  Supabase projeto criado
- [ ]  3 migrations executadas
- [ ]  OpenAI API key configurada
- [ ]  Redis rodando (local ou Upstash)
- [ ]  Backend dependencies instaladas
- [ ]  `.env` configurado
- [ ]  BaileysService implementado
- [ ]  AuroraService implementado
- [ ]  Workers rodando
- [ ]  WhatsApp conectado via pairing code
- [ ]  IA Cliente respondendo
- [ ]  Número do dono cadastrado
- [ ]  Aurora respondendo analytics

---

**Sistema 100% funcional! Próximos passos: Dashboard frontend 🎨**
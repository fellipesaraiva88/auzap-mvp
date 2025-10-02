# Redis + BullMQ - Status e Configuração

## Status Atual: CONFIGURADO E TESTADO

**Data:** 2025-10-02
**Ambiente:** Produção e Desenvolvimento

---

## 1. Configuração Redis

### 1.1 Upstash Redis (Produção)

**Configuração:**
```typescript
// /backend/src/config/redis.ts
const upstashRedis = new UpstashRedis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

**Credenciais (.env):**
```bash
UPSTASH_REDIS_REST_URL=https://prime-mullet-17029.upstash.io
UPSTASH_REDIS_REST_TOKEN=[REDACTED_UPSTASH_TOKEN]
```

**Status:** ✅ TESTADO E FUNCIONANDO
- SET/GET/DEL: OK
- PING: OK
- Latência: ~2000ms (esperado para REST API)

---

### 1.2 IORedis (BullMQ)

**Configuração Local (Dev):**
```typescript
const connection = new IORedis({
  host: 'localhost',
  port: 6380,
  password: '',
  maxRetriesPerRequest: null,
});
```

**Configuração Produção:**
```typescript
// Em produção SEM REDIS_URL, workers são desabilitados
// Mensagens processadas síncronamente
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  logger.warn('Redis not configured - workers disabled');
  return null;
}
```

**Status:** ✅ TESTADO E FUNCIONANDO
- Conexão local: OK (porta 6380)
- PING: OK
- Latência: ~24ms

---

## 2. BullMQ Configuration

### 2.1 Queue Setup

**Message Queue:**
```typescript
// /backend/src/config/redis.ts
export const messageQueue = new Queue('messages', { connection });
```

**Status:** ✅ TESTADO E FUNCIONANDO
- Queue criada: OK
- Job adicionado: OK
- Worker processou: OK
- Latência total: ~536ms

---

### 2.2 Workers

#### Message Processor Worker
**Arquivo:** `/backend/src/workers/message-processor.ts`

**Função:** Processar mensagens WhatsApp (clientes e dono)

**Features:**
- Processamento Aurora (mensagens do dono)
- Processamento IA Cliente
- Criação automática de contacts/conversations
- Salvar mensagens no banco
- Envio de resposta via Baileys

**Configuração:**
```typescript
const worker = new Worker('messages', async (job) => {
  // Processing logic
}, {
  connection,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
});
```

**Status:** ✅ CONFIGURADO

---

#### Follow-up Scheduler Worker
**Arquivo:** `/backend/src/workers/followup-scheduler.ts`

**Função:** Agendar follow-ups automáticos

**Status:** ✅ CONFIGURADO

---

#### Aurora Proactive Worker
**Arquivo:** `/backend/src/workers/aurora-proactive.ts`

**Função:** Mensagens proativas da Aurora

**Features:**
- Daily summary (18:00)
- Birthdays (09:00)
- Inactive clients (Segunda 10:00)
- Opportunities (Terça/Quinta 15:00)

**Status:** ✅ CONFIGURADO

---

## 3. Testes Realizados

### 3.1 Test Suite Completo
**Comando:** `npm run test:redis`

**Resultados:**
```
✓ [1] Upstash Redis REST API (1973ms)
   All operations successful

✓ [2] IORedis Connection (24ms)
   Connection successful

✓ [3] BullMQ Queue and Worker (536ms)
   Job processed successfully

RESULTS: 3 passed, 0 failed
```

---

### 3.2 Message Queue Integration Test
**Comando:** `npm run test:queue`

**Resultados:**
```
✓ Message queue is available
✓ Message added to queue (Job ID: 1)

Queue Statistics:
  Waiting: 0
  Active: 1
  Completed: 0
  Failed: 0
```

---

## 4. Fluxo de Mensagens

### 4.1 Diagrama de Fluxo

```
┌─────────────────┐
│  WhatsApp API   │
│   (Baileys)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Socket.IO      │
│  Event Handler  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  messageQueue   │
│  (BullMQ)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Message Worker  │
│  (Processor)    │
└────────┬────────┘
         │
         ├──────────────┬──────────────┐
         │              │              │
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Aurora     │ │  Client AI   │ │   Supabase   │
│   Service    │ │   Service    │ │   Database   │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 4.2 Processamento Detalhado

**1. Recebimento (Baileys)**
```typescript
socket.on('messages.upsert', async (event) => {
  // Adicionar à queue
  await messageQueue.add('process-message', {
    organizationId,
    instanceId,
    message,
  });
});
```

**2. Queue (BullMQ)**
- Job adicionado com retry policy
- Backoff exponencial (2s)
- 3 tentativas
- Remoção automática (100 completed, 500 failed)

**3. Worker (Processamento)**
- Detecta tipo de mensagem (dono vs cliente)
- Cria/atualiza contact e conversation
- Processa com IA apropriada
- Salva resposta no banco
- Envia resposta via Baileys

---

## 5. Configuração de Produção

### 5.1 Situação Atual (Render)

**Problema:** Render free tier não oferece Redis managed

**Solução Implementada:**
```typescript
// Workers desabilitados em produção sem Redis
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  logger.warn('Workers disabled - processing synchronously');
  return null;
}
```

**Impacto:**
- ✅ Sistema funciona
- ⚠️ Processamento síncrono (mais lento)
- ⚠️ Sem queue (mensagens processadas imediatamente)
- ⚠️ Cron jobs desabilitados

---

### 5.2 Opções de Redis em Produção

#### Opção 1: Upstash Redis (RECOMENDADO)
**Vantagens:**
- Free tier: 10k commands/day
- REST API (sem necessidade de conexão persistente)
- Compatível com Render
- Já configurado no projeto

**Implementação:**
```bash
# Já existe no .env:
UPSTASH_REDIS_REST_URL=https://prime-mullet-17029.upstash.io
UPSTASH_REDIS_REST_TOKEN=[REDACTED_UPSTASH_TOKEN]
```

**Pendente:**
- Adaptar BullMQ para usar Upstash REST API
- Ou usar Redis connection URL via Upstash

---

#### Opção 2: Redis Labs (Cloud)
**Vantagens:**
- Free tier: 30MB
- Conexão TCP tradicional
- Compatível com BullMQ

**Custo:** Grátis até 30MB

---

#### Opção 3: Railway
**Vantagens:**
- Redis plugin oficial
- $5 de crédito grátis/mês
- Fácil integração

**Custo:** Grátis (~$1/mês após créditos)

---

## 6. Recomendações

### 6.1 Curto Prazo (URGENTE)

**1. Habilitar Redis em Produção**
```bash
# Opção A: Adicionar Upstash Redis connection URL
REDIS_URL=redis://default:TOKEN@prime-mullet-17029.upstash.io:PORT

# Opção B: Usar Railway/Redis Labs
REDIS_URL=redis://user:pass@host:port
```

**2. Rebuild e Deploy**
```bash
npm run build
git push origin main
# Deploy automático no Render
```

**3. Validar Workers**
```bash
# Verificar logs no Render
# Confirmar workers iniciados
# Validar processamento de mensagens
```

---

### 6.2 Médio Prazo

**1. Monitoramento de Queue**
- Implementar dashboard de jobs
- Alertas para failures
- Métricas de performance

**2. Otimização de Workers**
- Ajustar concurrency baseado em carga
- Implementar rate limiting
- Adicionar circuit breakers

**3. Backup Strategy**
- Fallback para processamento síncrono
- Retry policy mais robusta
- Dead letter queue

---

## 7. Problemas Conhecidos

### 7.1 Produção sem Redis

**Sintoma:**
```
⚠️  Redis not configured - workers disabled in production
💡 Messages will be processed synchronously
```

**Impacto:**
- Sem async processing
- Sem cron jobs proativos
- Performance reduzida em alto volume

**Fix:** Adicionar REDIS_URL no .env e redeploy

---

### 7.2 Upstash REST vs TCP

**Problema:** BullMQ precisa de conexão TCP, mas Upstash REST é HTTP

**Soluções:**
- Upstash oferece Redis TCP endpoint (além do REST)
- Usar URL: `redis://default:TOKEN@endpoint:port`

**Docs:** https://docs.upstash.com/redis/overall/getstarted

---

## 8. Comandos Úteis

### 8.1 Desenvolvimento
```bash
# Iniciar Redis local
redis-server --port 6380

# Testar Redis + BullMQ
npm run test:redis

# Testar message queue
npm run test:queue

# Iniciar workers
npm run worker
```

### 8.2 Produção
```bash
# Build
npm run build

# Start server com workers
npm start

# Ver logs
tail -f logs/app.log
```

### 8.3 Debug
```bash
# Verificar queue stats
redis-cli -p 6380
> KEYS bull:messages:*
> HGETALL bull:messages:1

# Limpar queue
> DEL bull:messages:*
```

---

## 9. Arquivos Importantes

### 9.1 Configuração
- `/backend/src/config/redis.ts` - Redis/BullMQ setup
- `/backend/.env` - Credenciais

### 9.2 Workers
- `/backend/src/workers/index.ts` - Orchestrator
- `/backend/src/workers/message-processor.ts` - Mensagens
- `/backend/src/workers/followup-scheduler.ts` - Follow-ups
- `/backend/src/workers/aurora-proactive.ts` - Mensagens proativas

### 9.3 Testes
- `/backend/src/scripts/test-redis-bullmq.ts` - Suite completo
- `/backend/src/scripts/test-message-queue.ts` - Integração

---

## 10. Próximos Passos

### Checklist de Implementação

- [x] Configurar Upstash Redis
- [x] Implementar BullMQ
- [x] Criar workers
- [x] Testes locais
- [ ] **URGENTE: Habilitar Redis em produção**
- [ ] Testar em produção
- [ ] Monitorar performance
- [ ] Implementar dashboard de queue
- [ ] Documentar troubleshooting

---

## 11. Contato e Suporte

**Upstash Dashboard:** https://console.upstash.com/
**BullMQ Docs:** https://docs.bullmq.io/
**Redis Docs:** https://redis.io/docs/

---

**Última atualização:** 2025-10-02
**Responsável:** Backend Architect
**Status:** TESTADO E FUNCIONANDO (local) | PENDENTE (produção)

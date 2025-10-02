# 🔄 BullMQ Queue System

## Branch
`feature/bullmq-queue-system`

## Objetivo
Sistema de filas robusto para processamento assíncrono de mensagens WhatsApp e automações.

## Stack
- BullMQ (Redis-based)
- Redis 7+ (Render Redis)
- Node.js + TypeScript
- Bull Board (UI de monitoring)

## Filas Principais

### 1. Message Queue (Alta Prioridade)
```typescript
// Processa mensagens recebidas do WhatsApp
messageQueue.add('process-message', {
  conversationId,
  messageId,
  organizationId,
  senderNumber,
  content
}, {
  priority: 1, // Alta prioridade
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
})
```

### 2. Campaign Queue (Baixa Prioridade)
```typescript
// Envio de mensagens em massa (Aurora)
campaignQueue.add('send-campaign', {
  campaignId,
  organizationId,
  recipients: [],
  template
}, {
  priority: 5, // Baixa prioridade
  attempts: 2,
  backoff: { type: 'fixed', delay: 5000 }
})
```

### 3. Automation Queue (Média Prioridade)
```typescript
// Automações agendadas (lembretes, follow-ups)
automationQueue.add('send-reminder', {
  bookingId,
  organizationId,
  recipientNumber,
  type: 'appointment-reminder'
}, {
  delay: reminderTime - Date.now(),
  priority: 3,
  attempts: 2
})
```

## Arquivos Principais
- `backend/src/queue/queue-manager.ts` - Gerenciamento central
- `backend/src/queue/workers/message.worker.ts` - Worker de mensagens
- `backend/src/queue/workers/campaign.worker.ts` - Worker de campanhas
- `backend/src/queue/workers/automation.worker.ts` - Worker de automações
- `backend/src/queue/monitoring/bull-board.ts` - UI de monitoring
- `backend/src/queue/health-check.ts` - Health check Redis

## Configuração Redis
```typescript
// Render Redis URL
const redisConfig = {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    maxRetriesPerRequest: null, // BullMQ requirement
    enableReadyCheck: false
  }
}
```

## Monitoring (Bull Board)
- Endpoint: `/admin/queues`
- Auth: Owner-only (authorized_owner_numbers)
- Métricas: Jobs waiting, active, completed, failed
- Actions: Retry failed, clean old jobs, pause/resume

## Prompt Inicial
```
Implementa sistema BullMQ completo. Cria queue-manager.ts com 3 filas: messageQueue (prioridade 1), campaignQueue (prioridade 5), automationQueue (prioridade 3). Workers dedicados em workers/. Bull Board em /admin/queues (auth owner-only). Health check Redis em /health/redis. SEMPRE usar exponential backoff. Stack: BullMQ + Redis 7 + TypeScript.
```

## Performance Targets
- Message processing: <5s (p95)
- Campaign throughput: 100 msgs/min
- Redis latency: <10ms
- Worker concurrency: 5 jobs simultâneos
- Failed job retention: 7 dias

## Dead Letter Queue (DLQ)
```typescript
// Jobs que falharam após max retries
dlqQueue.add('failed-message', {
  originalJob,
  error,
  timestamp,
  organizationId
}, {
  removeOnComplete: false, // Manter para análise
  removeOnFail: false
})
```

## Comandos
```bash
# Start workers
npm run workers:start

# Monitor queues
npm run queues:monitor

# Clean old jobs
npm run queues:clean -- --age=7d

# Retry failed jobs
npm run queues:retry-failed
```

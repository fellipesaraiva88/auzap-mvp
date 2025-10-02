# Guia de Troubleshooting - Baileys/WhatsApp

## 🔍 Diagnóstico Rápido

### Verificar Status da Instância
```bash
curl http://localhost:3000/api/whatsapp/health/{instanceId}
```

### Logs a Observar
1. **Connection Logs**: Procurar por `connection.update`
2. **Error Logs**: Filtrar por `[ERROR]` e `baileys`
3. **Session Logs**: Procurar por `creds.update` e `session_data`
4. **Message Logs**: Filtrar por `messages.upsert`

---

## 🚨 Problemas Comuns e Soluções

### 1. Connection Drops / Disconnects

**Sintomas:**
- Instance desconecta frequentemente
- Status muda para `disconnected` sem motivo aparente
- Logs mostram `connection: close`

**Diagnóstico:**
```bash
# Verificar histórico de reconexões
curl http://localhost:3000/api/whatsapp/diagnostics/{instanceId}

# Observar logs
grep "connection.update" logs/backend.log | tail -20
```

**Possíveis Causas:**
1. **Rede instável**: Latência alta ou packet loss
2. **WhatsApp detectou múltiplas conexões**: Mesmo número em vários devices
3. **Session corrompida**: Credenciais inválidas
4. **Rate limiting**: Muitas mensagens enviadas

**Soluções:**

✅ **Solução Imediata:**
```bash
# Reconectar manualmente
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/connect \
  -H "Content-Type: application/json" \
  -d '{"method": "code", "phone_number": "5511999999999"}'
```

✅ **Solução Permanente:**
- Implementado: Reconnection automática com exponential backoff
- Max 5 tentativas com delays de 2s, 4s, 8s, 16s, 30s
- Após 5 falhas, requer intervenção manual

**Quando fazer restart completo:**
- Após 5 tentativas falhadas
- Se logs mostram `session_corrupted`
- Se QR Code não é gerado após 2 minutos

---

### 2. Session Corruption

**Sintomas:**
- QR Code não é aceito
- Pairing code falha
- Logs mostram `Invalid credentials`
- Instance conecta mas desconecta imediatamente

**Diagnóstico:**
```typescript
// Verificar session health
GET /api/whatsapp/health/{instanceId}

// Resposta esperada:
{
  "sessionHealth": {
    "hasValidCreds": true,
    "hasValidKeys": true,
    "lastBackup": "2025-01-10T12:00:00Z"
  }
}
```

**Soluções:**

✅ **1. Validar Session Data:**
```sql
-- No Supabase
SELECT
  id,
  instance_name,
  session_data IS NOT NULL as has_session,
  status
FROM whatsapp_instances
WHERE id = '{instance_id}';
```

✅ **2. Clear Session (CUIDADO!):**
```sql
-- BACKUP PRIMEIRO!
UPDATE whatsapp_instances
SET
  session_data = NULL,
  status = 'disconnected',
  qr_code = NULL,
  pairing_code = NULL
WHERE id = '{instance_id}';
```

✅ **3. Reconectar do zero:**
```bash
# Gerar novo QR/Pairing Code
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/connect \
  -H "Content-Type: application/json" \
  -d '{"method": "code", "phone_number": "5511999999999"}'
```

**Prevenção:**
- ✅ Implementado: Backup automático de sessão a cada hora
- ✅ Implementado: Validação de session_data antes de usar
- ⚠️ TODO: Alert quando session_data está corrompida

---

### 3. QR Code Expiration

**Sintomas:**
- QR Code não pode ser escaneado
- Frontend mostra QR expirado
- Logs mostram timeout

**Diagnóstico:**
```typescript
GET /api/whatsapp/health/{instanceId}

// Verificar qrCodeStatus:
{
  "qrCodeStatus": {
    "generated": true,
    "expiresAt": "2025-01-10T12:05:00Z",
    "expired": true
  }
}
```

**Soluções:**

✅ **Re-gerar QR automaticamente:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/regenerate-qr
```

**Implementado:**
- Timeout de 5 minutos para QR Code
- Notificação via Socket.IO quando expirar
- Frontend pode solicitar novo QR automaticamente

**Comando Manual:**
```bash
# Forçar geração de novo QR
curl -X DELETE http://localhost:3000/api/whatsapp/instances/{id}
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/connect \
  -d '{"method": "qr"}'
```

---

### 4. Rate Limiting / WhatsApp Blocks

**Sintomas:**
- Mensagens não são enviadas
- Logs mostram `rate_overlimit`
- WhatsApp retorna erro 429
- Instance é bloqueada temporariamente

**Diagnóstico:**
```typescript
GET /api/whatsapp/health/{instanceId}

// Verificar rateLimiting:
{
  "rateLimiting": {
    "messagesInLastMinute": 25,
    "throttled": true
  }
}
```

**Limites do WhatsApp:**
- **Personal**: ~20 mensagens/minuto
- **Business**: ~40 mensagens/minuto
- **Burst**: 100 mensagens/hora

**Soluções:**

✅ **1. Queue com Backpressure (Implementado):**
```typescript
// Em baileys.service.ts
// Queue limita automaticamente para 20 msgs/min
await messageQueue.add('send-message', {
  instanceId,
  to,
  message
}, {
  delay: calculateDelay() // Delay automático se throttled
});
```

✅ **2. Monitorar Rate:**
```bash
# Verificar quantas mensagens foram enviadas
curl http://localhost:3000/api/whatsapp/health/{instanceId} | \
  jq '.rateLimiting'
```

✅ **3. Pausar Envios:**
```bash
# Pausar campanha se rate limit atingido
curl -X POST http://localhost:3000/api/campaigns/{id}/pause
```

**Prevenção:**
- ✅ Implementado: Rate limiter de 20 msgs/min
- ✅ Implementado: Queue com retry exponencial
- ✅ Implementado: Alert quando próximo do limite (15 msgs/min)

**Se bloqueado:**
1. Aguardar 24 horas
2. Reduzir velocidade de envio
3. Usar múltiplas instâncias (load balancing)

---

### 5. Multi-Instance Memory Leaks

**Sintomas:**
- Memory usage cresce continuamente
- Backend fica lento após horas rodando
- OOM (Out of Memory) crashes

**Diagnóstico:**
```typescript
GET /api/whatsapp/health/{instanceId}

// Verificar memoryUsage:
{
  "memoryUsage": {
    "heapUsed": 450000000,  // ~450 MB
    "heapTotal": 500000000, // ~500 MB
    "rss": 600000000        // ~600 MB
  }
}
```

**Limites Saudáveis:**
- **heapUsed/heapTotal ratio**: < 0.9 (90%)
- **Total RSS**: < 1 GB por instância
- **Crescimento**: < 10 MB/hora

**Soluções:**

✅ **1. Cleanup ao Desconectar:**
```typescript
// Implementado em baileys.service.ts
static async disconnectInstance(organizationId: string, instanceId: string) {
  const key = `${organizationId}:${instanceId}`;
  const instance = instances.get(key);

  if (instance) {
    instance.socket.end();
    instances.delete(key);
    BaileysHealthService.clearStats(organizationId, instanceId);
  }
}
```

✅ **2. Periodic Cleanup:**
```typescript
// TODO: Implementar cleanup job
// Limpar instâncias inativas há mais de 24h
setInterval(() => {
  cleanupInactiveInstances();
}, 3600000); // 1 hora
```

✅ **3. Restart Programado:**
```bash
# PM2 restart baseado em memory
pm2 start ecosystem.config.js --max-memory-restart 1G
```

**Monitoramento:**
```bash
# Verificar memory de todas instâncias
curl http://localhost:3000/api/whatsapp/health/all | \
  jq -r '.[] | "\(.instanceId): \(.memoryUsage.rss / 1024 / 1024)MB"'
```

---

## 🛠️ Comandos de Diagnóstico

### 1. Health Check Completo
```bash
curl http://localhost:3000/api/whatsapp/health/{instanceId}
```

**Resposta:**
```json
{
  "instanceId": "xxx",
  "connected": true,
  "uptime": 3600000,
  "stats": {
    "messagesProcessed": 150,
    "messagesSent": 100,
    "messagesReceived": 50,
    "reconnectAttempts": 0
  },
  "sessionHealth": {
    "hasValidCreds": true,
    "hasValidKeys": true,
    "lastBackup": "2025-01-10T12:00:00Z"
  },
  "rateLimiting": {
    "messagesInLastMinute": 5,
    "throttled": false
  }
}
```

### 2. Diagnóstico Avançado
```bash
curl http://localhost:3000/api/whatsapp/diagnostics/{instanceId}
```

**Resposta:**
```json
{
  "checks": {
    "connection": {
      "status": "ok",
      "details": "Connection is healthy"
    },
    "session": {
      "status": "warning",
      "details": "QR Code has expired"
    },
    "performance": {
      "status": "ok",
      "details": "Performance is normal"
    },
    "rateLimit": {
      "status": "ok",
      "details": "Rate limiting is healthy"
    }
  },
  "recommendations": [
    "Generate new QR code or pairing code"
  ]
}
```

### 3. Logs em Tempo Real
```bash
# Backend logs
tail -f logs/backend.log | grep baileys

# Filtrar por instanceId
tail -f logs/backend.log | grep "instanceId.*{id}"

# Apenas erros
tail -f logs/backend.log | grep -E "ERROR|baileys"
```

### 4. Database Queries
```sql
-- Status de todas instâncias
SELECT
  id,
  instance_name,
  status,
  reconnect_attempts,
  last_connected_at,
  messages_sent_count
FROM whatsapp_instances
ORDER BY last_connected_at DESC;

-- Instâncias com problemas
SELECT *
FROM whatsapp_instances
WHERE status = 'disconnected'
  OR reconnect_attempts > 3
  OR last_connected_at < NOW() - INTERVAL '1 hour';
```

---

## 🔧 Soluções Rápidas

### Restart Instance
```bash
# Soft restart (mantém session)
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/restart

# Hard restart (limpa session)
curl -X DELETE http://localhost:3000/api/whatsapp/instances/{id}
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/connect
```

### Clear Queue
```bash
# Limpar fila de mensagens pendentes
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/clear-queue
```

### Force Reconnect
```bash
# Forçar reconexão imediata
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/force-reconnect
```

---

## 📊 Métricas a Monitorar

### KPIs Críticos:
1. **Connection Uptime**: > 99%
2. **Reconnect Success Rate**: > 90%
3. **Message Delivery Rate**: > 95%
4. **Average Response Time**: < 2s
5. **Memory Usage**: < 1 GB/instance

### Alertas Configurar:
- ⚠️ Reconnect attempts > 3
- 🚨 Rate limit atingido
- 🚨 Memory usage > 90%
- ⚠️ Session corruption detectada
- 🚨 Instance down > 5 minutos

---

## 🎯 Checklist de Debug

Ao investigar problema, seguir esta ordem:

- [ ] 1. Verificar logs recentes (últimos 10 minutos)
- [ ] 2. Executar health check da instância
- [ ] 3. Verificar status no database (Supabase)
- [ ] 4. Executar diagnóstico completo
- [ ] 5. Verificar network connectivity (ping WhatsApp servers)
- [ ] 6. Validar session data
- [ ] 7. Verificar rate limiting
- [ ] 8. Checar memory usage
- [ ] 9. Tentar soft restart
- [ ] 10. Se necessário, hard restart com clear session

---

## 🚀 Prevenção de Problemas

### Implementado:
- ✅ Auto-reconnect com exponential backoff
- ✅ Session backup a cada hora
- ✅ Rate limiting automático
- ✅ Health checks via API
- ✅ Diagnósticos avançados
- ✅ Cleanup de memória ao desconectar

### TODO:
- ⚠️ Alertas proativos (Slack/Email)
- ⚠️ Auto-restart se memory > 1 GB
- ⚠️ Load balancing entre instâncias
- ⚠️ Circuit breaker para WhatsApp API
- ⚠️ Metrics dashboard (Grafana)

---

## 📞 Quando Pedir Ajuda

Contactar suporte se:
1. Instance não conecta após 5 tentativas
2. Session corruption recorrente (> 3x/dia)
3. Memory leak não resolvido com restart
4. Rate limit permanente (> 24h)
5. Bugs no código Baileys (reportar no GitHub)

---

## 🔗 Recursos Úteis

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Bull Queue](https://github.com/OptimalBits/bull)

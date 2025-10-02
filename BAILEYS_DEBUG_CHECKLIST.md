# ✅ Checklist de Debug Preventivo - Baileys

## 🎯 Sistema Implementado

### ✅ 1. Health Check Service
**Arquivo**: `/backend/src/services/baileys-health.service.ts`

**Funcionalidades**:
- ✅ Health status detalhado de instâncias
- ✅ Diagnóstico completo com recomendações
- ✅ Tracking de mensagens processadas
- ✅ Monitoramento de rate limiting
- ✅ Validação de session data
- ✅ Backup automático de sessões
- ✅ Memory usage monitoring

**Endpoints**:
```bash
GET /api/whatsapp/health/:instanceId
GET /api/whatsapp/diagnostics/:instanceId
GET /api/whatsapp/health/all
```

---

### ✅ 2. Reconnect Service
**Arquivo**: `/backend/src/services/baileys-reconnect.service.ts`

**Funcionalidades**:
- ✅ Exponential backoff (2s, 4s, 8s, 16s, 30s)
- ✅ Max 5 tentativas de reconnect
- ✅ Detecção de erros não-recuperáveis
- ✅ Validação de session antes de reconnect
- ✅ Histórico de reconexões
- ✅ Cancelamento de reconnect

**Algoritmo**:
```typescript
delay = baseDelay * (backoffMultiplier ^ attempt)
Min: 2s, Max: 30s
```

---

### ✅ 3. Health Routes
**Arquivo**: `/backend/src/routes/whatsapp-health.routes.ts`

**Endpoints Implementados**:

#### Health & Diagnostics
- `GET /api/whatsapp/health/:instanceId` - Health detalhado
- `GET /api/whatsapp/diagnostics/:instanceId` - Diagnóstico + recomendações
- `GET /api/whatsapp/health/all` - Status de todas instâncias

#### Management
- `POST /api/whatsapp/instances/:id/restart` - Soft restart
- `POST /api/whatsapp/instances/:id/regenerate-qr` - Novo QR Code
- `POST /api/whatsapp/instances/:id/force-reconnect` - Force reconnect
- `POST /api/whatsapp/instances/:id/backup-session` - Backup manual
- `POST /api/whatsapp/instances/:id/validate-session` - Validar session

#### Monitoring
- `GET /api/whatsapp/instances/:id/reconnect-history` - Histórico

---

### ✅ 4. Troubleshooting Guide
**Arquivo**: `/TROUBLESHOOTING_BAILEYS.md`

**Conteúdo**:
- ✅ Diagnóstico rápido
- ✅ 5 problemas comuns + soluções
- ✅ Comandos de diagnóstico
- ✅ Soluções rápidas
- ✅ Métricas a monitorar
- ✅ Checklist de debug
- ✅ Prevenção de problemas

**Problemas Cobertos**:
1. Connection Drops
2. Session Corruption
3. QR Code Expiration
4. Rate Limiting
5. Memory Leaks

---

## 🔧 Integrações Necessárias

### ⚠️ Baileys Service Updates (TODO)

**Arquivo**: `/backend/src/services/baileys.service.ts`

Integrar:
```typescript
// 1. Connection Close Handler
const reconnectDecision = BaileysReconnectService.shouldReconnect(
  lastDisconnect,
  instance
);

if (reconnectDecision.shouldReconnect) {
  await BaileysReconnectService.attemptReconnect(instance, reconnectFn);
}

// 2. Message Received Handler
BaileysHealthService.incrementMessageCount(orgId, instanceId, 'received');

// 3. Send Message Handler
const health = await BaileysHealthService.getHealthStatus(orgId, instanceId);
if (health.rateLimiting.throttled) {
  throw new Error('Rate limit exceeded');
}
BaileysHealthService.incrementMessageCount(orgId, instanceId, 'sent');

// 4. Error Handler
BaileysHealthService.recordError(orgId, instanceId, error, code);
```

---

## 📊 Métricas de Sucesso

### KPIs
- **Connection Uptime**: > 99%
- **Reconnect Success Rate**: > 90%
- **Message Delivery Rate**: > 95%
- **Avg Response Time**: < 2s
- **Memory/Instance**: < 1 GB

### Alertas Configurar
- ⚠️ Reconnect attempts > 3
- 🚨 Rate limit atingido (20+ msgs/min)
- 🚨 Memory usage > 90%
- ⚠️ Session corruption detectada
- 🚨 Instance down > 5 min

---

## 🚀 Comandos Úteis

### Health Check
```bash
# Status de uma instância
curl http://localhost:3000/api/whatsapp/health/{instanceId}

# Diagnóstico completo
curl http://localhost:3000/api/whatsapp/diagnostics/{instanceId}

# Status de todas
curl http://localhost:3000/api/whatsapp/health/all
```

### Troubleshooting
```bash
# Restart suave
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/restart

# Novo QR Code
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/regenerate-qr

# Force reconnect
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/force-reconnect

# Validar session
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/validate-session

# Backup session
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/backup-session

# Histórico de reconnect
curl http://localhost:3000/api/whatsapp/instances/{id}/reconnect-history
```

### Database Queries
```sql
-- Instâncias com problemas
SELECT *
FROM whatsapp_instances
WHERE status = 'disconnected'
  OR reconnect_attempts > 3
  OR last_connected_at < NOW() - INTERVAL '1 hour';

-- Stats gerais
SELECT
  status,
  COUNT(*) as count,
  AVG(reconnect_attempts) as avg_reconnects
FROM whatsapp_instances
GROUP BY status;
```

---

## 🎓 Workflow de Debug

### Ao Investigar Problema:

1. ☑️ Verificar logs recentes
   ```bash
   tail -f logs/backend.log | grep baileys
   ```

2. ☑️ Health check da instância
   ```bash
   curl http://localhost:3000/api/whatsapp/health/{id}
   ```

3. ☑️ Diagnóstico completo
   ```bash
   curl http://localhost:3000/api/whatsapp/diagnostics/{id}
   ```

4. ☑️ Verificar no Supabase
   ```sql
   SELECT * FROM whatsapp_instances WHERE id = '{id}';
   ```

5. ☑️ Validar session
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/validate-session
   ```

6. ☑️ Tentar soft restart
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/restart
   ```

7. ☑️ Se necessário, hard restart
   ```bash
   curl -X DELETE http://localhost:3000/api/whatsapp/instances/{id}
   curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/connect
   ```

---

## 📚 Arquivos Criados

### Services
- ✅ `/backend/src/services/baileys-health.service.ts` (384 linhas)
- ✅ `/backend/src/services/baileys-reconnect.service.ts` (267 linhas)

### Routes
- ✅ `/backend/src/routes/whatsapp-health.routes.ts` (250 linhas)

### Documentation
- ✅ `/TROUBLESHOOTING_BAILEYS.md` (500+ linhas)
- ✅ `/BAILEYS_DEBUG_CHECKLIST.md` (este arquivo)

### Updates
- ✅ `/backend/src/index.ts` - Rotas de health adicionadas
- ⚠️ `/backend/src/services/baileys.service.ts` - Integrações pendentes

---

## 🔄 Próximos Passos

### Implementação Imediata
1. ⚠️ Integrar BaileysReconnectService no baileys.service.ts
2. ⚠️ Integrar BaileysHealthService no baileys.service.ts
3. ⚠️ Testar endpoints de health
4. ⚠️ Testar fluxo de reconnect

### Melhorias Futuras
- ⚠️ Dashboard de métricas (Grafana/Prometheus)
- ⚠️ Alertas via Slack/Email
- ⚠️ Auto-restart se memory > 1 GB
- ⚠️ Load balancing entre instâncias
- ⚠️ Circuit breaker para WhatsApp API

---

## 🎯 Como Usar

### 1. Monitoramento Proativo
```bash
# Verificar saúde de todas instâncias
curl http://localhost:3000/api/whatsapp/health/all | jq -r '.[] | "\(.instanceId): \(.connected) - \(.rateLimiting.messagesInLastMinute) msgs/min"'
```

### 2. Debug de Problema
```bash
# Health + Diagnostics
curl http://localhost:3000/api/whatsapp/diagnostics/{instanceId} | jq '.recommendations'
```

### 3. Intervenção Manual
```bash
# Se diagnostics sugere regenerate QR
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/regenerate-qr

# Se diagnostics sugere restart
curl -X POST http://localhost:3000/api/whatsapp/instances/{id}/restart
```

---

## 📞 Suporte

**Consultar**:
- TROUBLESHOOTING_BAILEYS.md - Guia detalhado
- Logs: `tail -f logs/backend.log | grep baileys`
- Supabase: Verificar tabela `whatsapp_instances`
- GitHub Baileys: https://github.com/WhiskeySockets/Baileys

**Quando Escalar**:
- Instance não conecta após 5 tentativas
- Session corruption recorrente (> 3x/dia)
- Memory leak persistente
- Rate limit permanente (> 24h)

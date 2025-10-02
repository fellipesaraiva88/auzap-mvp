# Validação Socket.IO + Baileys - Relatório de Análise

## Status Geral: ⚠️ PARCIALMENTE IMPLEMENTADO

---

## 1. VALIDAÇÃO DO SOCKET.IO SERVER ✅

### `/backend/src/index.ts`

**✅ Implementado Corretamente:**
- Socket.IO server rodando com CORS configurado
- Suporte a múltiplas origens (dev + prod)
- Rooms por organization (`org-${organizationId}`)
- Evento `join-organization` funcional
- Export de `io` para uso em outros serviços

**Código Validado:**
```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  socket.on('join-organization', (organizationId) => {
    socket.join(`org-${organizationId}`);
  });
});
```

---

## 2. VALIDAÇÃO DO BAILEYS SERVICE ⚠️

### `/backend/src/services/baileys.service.ts`

**✅ Implementado:**
- Pairing code como método preferencial
- Session persistence no Supabase
- QR Code emitido via Socket.IO (linha 153)
- Reconnection logic

**❌ PROBLEMAS CRÍTICOS IDENTIFICADOS:**

### 2.1 Pairing Code NÃO é emitido via Socket.IO
**Linha 106-117:** Pairing code é salvo no banco, mas **NÃO É EMITIDO** via Socket.IO.

```typescript
// ATUAL (INCOMPLETO)
const code = await socket.requestPairingCode(phoneNumber);

await supabase
  .from('whatsapp_instances')
  .update({
    pairing_code: code,
    // ...
  })
  .eq('id', instanceId);

// ❌ FALTA: io.to(`org-${organizationId}`).emit('whatsapp:pairing-code', {...})
```

### 2.2 Evento de Conexão NÃO é emitido
**Linha 180-190:** Status atualizado no banco, mas **NÃO HÁ EMISSÃO** do evento `whatsapp:connected`.

```typescript
// ATUAL (INCOMPLETO)
if (connection === 'open') {
  await supabase
    .from('whatsapp_instances')
    .update({ status: 'connected' })
    .eq('id', instanceId);

  // ❌ FALTA: io.to(`org-${organizationId}`).emit('whatsapp:connected', {...})
}
```

### 2.3 Evento de Desconexão NÃO é emitido
**Linha 176-178:** Mesmo problema para disconnected.

### 2.4 Falta Validação de Formato de Telefone
Não há validação do formato de `phoneNumber` antes de `requestPairingCode()`.

### 2.5 Falta Timeout para Pairing Code
Código expira no banco (60s), mas **não há mecanismo** para invalidar após 5 minutos.

---

## 3. EVENTOS SOCKET.IO ESPERADOS vs IMPLEMENTADOS

| Evento | Esperado | Implementado | Status |
|--------|----------|--------------|--------|
| `whatsapp:qr` | ✅ | ✅ | Funcional |
| `whatsapp:pairing-code` | ✅ | ❌ | **FALTANDO** |
| `whatsapp:connected` | ✅ | ❌ | **FALTANDO** |
| `whatsapp:disconnected` | ✅ | ❌ | **FALTANDO** |

---

## 4. CORREÇÕES NECESSÁRIAS

### 4.1 Emitir Pairing Code via Socket.IO
**Arquivo:** `/backend/src/services/baileys.service.ts`

```typescript
// Após linha 106
const code = await socket.requestPairingCode(phoneNumber);

// ADICIONAR:
io.to(`org-${organizationId}`).emit('whatsapp:pairing-code', {
  instanceId,
  code,
  expiresAt: new Date(Date.now() + 300000).toISOString(), // 5min
  timestamp: new Date().toISOString(),
});

await supabase
  .from('whatsapp_instances')
  .update({
    pairing_code: code,
    pairing_code_expires_at: new Date(Date.now() + 300000).toISOString(),
    status: 'qr_pending',
  })
  .eq('id', instanceId);
```

### 4.2 Emitir Evento de Conexão
**Arquivo:** `/backend/src/services/baileys.service.ts`

```typescript
// Após linha 189
if (connection === 'open') {
  logger.info('Connection opened');
  instance.reconnectAttempts = 0;

  await supabase
    .from('whatsapp_instances')
    .update({
      status: 'connected',
      last_connected_at: new Date().toISOString(),
    })
    .eq('id', instance.instanceId);

  // ADICIONAR:
  io.to(`org-${instance.organizationId}`).emit('whatsapp:connected', {
    instanceId: instance.instanceId,
    status: 'connected',
    timestamp: new Date().toISOString(),
  });
}
```

### 4.3 Emitir Evento de Desconexão
**Arquivo:** `/backend/src/services/baileys.service.ts`

```typescript
// Após linha 178
await supabase
  .from('whatsapp_instances')
  .update({ status: 'disconnected' })
  .eq('id', instance.instanceId);

// ADICIONAR:
io.to(`org-${instance.organizationId}`).emit('whatsapp:disconnected', {
  instanceId: instance.instanceId,
  status: 'disconnected',
  reason: lastDisconnect?.error?.message,
  timestamp: new Date().toISOString(),
});
```

### 4.4 Validar Formato de Telefone
**Arquivo:** `/backend/src/services/baileys.service.ts`

```typescript
// Antes de linha 106
if (preferredMethod === 'code' && phoneNumber) {
  // ADICIONAR validação
  const phoneRegex = /^[1-9]\d{10,14}$/; // Formato internacional sem +
  if (!phoneRegex.test(phoneNumber)) {
    throw new Error('Invalid phone number format. Use international format without +: 5511999999999');
  }

  const code = await socket.requestPairingCode(phoneNumber);
  // ...
}
```

### 4.5 Implementar Timeout para Pairing Code
**Arquivo:** `/backend/src/services/baileys.service.ts`

```typescript
// Após emitir pairing code
setTimeout(async () => {
  const { data: currentInstance } = await supabase
    .from('whatsapp_instances')
    .select('status')
    .eq('id', instanceId)
    .single();

  if (currentInstance?.status === 'qr_pending') {
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        pairing_code: null
      })
      .eq('id', instanceId);

    io.to(`org-${organizationId}`).emit('whatsapp:pairing-code-expired', {
      instanceId,
      timestamp: new Date().toISOString(),
    });
  }
}, 300000); // 5min
```

---

## 5. LOGS ESTRUTURADOS ✅

**Validado:** Logger usando Pino está implementado corretamente.

```typescript
logger.info({ instanceId, organizationId }, 'QR Code generated');
```

---

## 6. TESTE DE INTEGRAÇÃO CRIADO ✅

**Arquivo:** `/backend/src/scripts/test-socket-baileys.ts`

Script completo para validar:
- Conexão Socket.IO
- Rooms por organization
- Criação de instância
- Emissão de pairing code
- Emissão de QR code
- Eventos de conexão/desconexão

**Executar:**
```bash
cd /Users/saraiva/final_auzap/backend
export TEST_ORG_ID="sua-org-id"
export TEST_PHONE="5511999999999"
ts-node src/scripts/test-socket-baileys.ts
```

---

## 7. PRÓXIMOS PASSOS

1. ✅ Aplicar correções no `baileys.service.ts`
2. ✅ Rodar teste de integração
3. ✅ Validar no frontend (listener Socket.IO)
4. ✅ Testar conexão real com WhatsApp

---

## 8. CHECKPOINT: Conecta 1 número e fica online?

**Resposta Atual:** ⚠️ **NÃO VALIDADO**

**Motivo:** Eventos críticos não estão sendo emitidos via Socket.IO, impedindo o frontend de receber notificações em tempo real.

**Após correções:** Sim, deve conectar e notificar o frontend corretamente.

---

## 9. ARQUIVOS MODIFICADOS/CRIADOS

- ✅ `/backend/src/scripts/test-socket-baileys.ts` (criado)
- ⚠️ `/backend/src/services/baileys.service.ts` (precisa correções)

---

**Data:** 2025-10-02
**Status:** Aguardando aprovação para aplicar correções

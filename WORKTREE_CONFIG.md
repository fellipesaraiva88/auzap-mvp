# 📱 Baileys WhatsApp Integration

## Branch
`feature/baileys-whatsapp`

## Objetivo
Integração completa do Baileys com autenticação via pairing code, persistência de sessão e multi-tenancy.

## Stack
- @whiskeysockets/baileys (latest)
- Node.js + TypeScript
- Redis (session storage)
- Render Persistent Disk (/app/sessions)

## Arquivos Principais
- `backend/src/services/whatsapp/baileys.service.ts` - Core Baileys
- `backend/src/services/whatsapp/session-manager.ts` - Gerenciamento de sessões
- `backend/src/services/whatsapp/connection-handler.ts` - Reconnection logic
- `backend/src/middleware/whatsapp-auth.middleware.ts` - Validação de instância
- `backend/src/controllers/whatsapp.controller.ts` - Endpoints

## Features Críticas
1. **Pairing Code** (8 dígitos) como método PRINCIPAL
2. **Persistência** em `/app/sessions/${organizationId}/${instanceId}`
3. **Multi-tenant** - uma instância por organization_id
4. **Auto-reconnect** com exponential backoff
5. **Event forwarding** para BullMQ (não processamento síncrono)

## Prompt Inicial
```
Implementa integração Baileys WhatsApp completa. Cria backend/src/services/whatsapp/baileys.service.ts com pairing code (método principal), session-manager.ts para persistir em /app/sessions, connection-handler.ts com auto-reconnect. SEMPRE usar multi-tenant (organization_id). NUNCA processar mensagens síncronamente - enviar para BullMQ. Stack: @whiskeysockets/baileys + TypeScript + Redis.
```

## Events para Capturar
```typescript
// SEMPRE encaminhar para queue, NÃO processar diretamente
- 'messages.upsert' → messageQueue.add()
- 'connection.update' → emit via Socket.IO
- 'creds.update' → persist to disk + Redis
- 'presence.update' → real-time via Socket.IO
- 'groups.update' → sync to Supabase
```

## Validações Obrigatórias
- ✅ Número no formato internacional (@c.us ou @g.us)
- ✅ Session válida antes de enviar
- ✅ Organization_id presente em TODA operação
- ✅ Rate limit: 20 msgs/min por instância
- ✅ Fallback para QR se pairing code falhar (raro)

## Comandos
```bash
# Test connection
npm run test:whatsapp

# Generate pairing code
npm run whatsapp:pair -- --org=org_123

# Debug session
npm run whatsapp:debug-session -- --org=org_123
```

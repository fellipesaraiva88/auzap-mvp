# Exemplos Práticos de Teste - Recepção de Mensagens

## Cenário 1: Teste Básico via cURL

### 1. Conectar Instância WhatsApp
```bash
curl -X POST http://localhost:3000/api/whatsapp/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "YOUR_ORG_ID",
    "instanceId": "YOUR_INSTANCE_ID",
    "phoneNumber": "5511999999999",
    "preferredMethod": "code"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "pairingCode": "ABCD1234",
  "method": "code"
}
```

### 2. Enviar Mensagem do seu Celular
- Abra WhatsApp no seu celular
- Envie mensagem para o número que você conectou
- Exemplo: "Olá, teste!"

### 3. Verificar se Mensagem foi Salva
```bash
curl -X GET http://localhost:3000/api/conversations \
  -H "x-organization-id: YOUR_ORG_ID"
```

**Resposta esperada:**
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "status": "active",
      "last_message_preview": "Olá, teste!",
      "unread_count": 1,
      "contact": {
        "phone": "5511988887777",
        "name": "5511988887777"
      }
    }
  ],
  "total": 1
}
```

### 4. Buscar Mensagens da Conversa
```bash
curl -X GET http://localhost:3000/api/conversations/conv-uuid/messages
```

**Resposta esperada:**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "conversation_id": "conv-uuid",
      "direction": "incoming",
      "content": "Olá, teste!",
      "message_type": "text",
      "from_me": false,
      "sent_by_ai": false,
      "created_at": "2025-10-02T01:30:00Z"
    }
  ],
  "total": 1
}
```

---

## Cenário 2: Teste com Script Automático

### Executar Script de Validação
```bash
cd backend
npx ts-node src/scripts/test-message-reception.ts
```

**Output esperado:**
```
=== TESTE DE RECEPÇÃO DE MENSAGENS ===

✓ Encontradas 1 instâncias conectadas
   1. AuZap Instance (5511999999999)

✓ Encontradas 5 mensagens nos últimos 5 minutos

Mensagens recentes:

   1. [INCOMING] 2025-10-02T01:30:00Z
      Conversa: abc-123
      Contato: João Silva
      Tipo: text
      Conteúdo: Olá, teste!
      From me: false
      Sent by AI: false

=== ESTATÍSTICAS GERAIS ===
   Total de mensagens: 42
   Total de conversas: 15
   Total de contatos: 12

=== INSTRUÇÕES PARA TESTAR ===
1. Envie uma mensagem para um dos números conectados acima
2. Aguarde alguns segundos
3. Execute este script novamente para ver a mensagem salva
4. Verifique também o Supabase Dashboard

✓ Teste concluído
```

---

## Cenário 3: Teste via Supabase SQL Editor

### Query 1: Verificar Mensagens Recebidas (últimos 10 minutos)
```sql
SELECT
  m.id,
  m.direction,
  m.content,
  m.message_type,
  m.created_at,
  c.name as contact_name,
  c.phone as contact_phone,
  conv.status as conversation_status
FROM messages m
JOIN conversations conv ON m.conversation_id = conv.id
JOIN contacts c ON conv.contact_id = c.id
WHERE
  m.direction = 'incoming'
  AND m.created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY m.created_at DESC;
```

### Query 2: Verificar Conversas Ativas
```sql
SELECT
  conv.id,
  conv.status,
  conv.last_message_at,
  conv.last_message_preview,
  conv.unread_count,
  c.name as contact_name,
  c.phone as contact_phone,
  wi.name as instance_name
FROM conversations conv
JOIN contacts c ON conv.contact_id = c.id
JOIN whatsapp_instances wi ON conv.whatsapp_instance_id = wi.id
WHERE conv.status = 'active'
ORDER BY conv.last_message_at DESC
LIMIT 10;
```

### Query 3: Estatísticas Gerais
```sql
SELECT
  COUNT(*) FILTER (WHERE direction = 'incoming') as incoming_messages,
  COUNT(*) FILTER (WHERE direction = 'outgoing') as outgoing_messages,
  COUNT(*) FILTER (WHERE sent_by_ai = true) as ai_responses,
  COUNT(DISTINCT conversation_id) as total_conversations,
  MIN(created_at) as first_message,
  MAX(created_at) as last_message
FROM messages
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

---

## Cenário 4: Teste com Postman/Insomnia

### Coleção de Requests

#### 1. Listar Conversas
```
GET http://localhost:3000/api/conversations?status=active&limit=20
Headers:
  x-organization-id: YOUR_ORG_ID
```

#### 2. Buscar Conversa Específica
```
GET http://localhost:3000/api/conversations/{conversationId}
Headers:
  x-organization-id: YOUR_ORG_ID
```

#### 3. Listar Mensagens
```
GET http://localhost:3000/api/conversations/{conversationId}/messages?limit=50
```

#### 4. Marcar como Lida
```
POST http://localhost:3000/api/conversations/{conversationId}/read
```

#### 5. Fechar Conversa
```
POST http://localhost:3000/api/conversations/{conversationId}/close
```

#### 6. Arquivar Conversa
```
POST http://localhost:3000/api/conversations/{conversationId}/archive
```

#### 7. Enviar Mensagem Manualmente
```
POST http://localhost:3000/api/conversations/{conversationId}/messages
Headers:
  x-organization-id: YOUR_ORG_ID
  Content-Type: application/json
Body:
{
  "content": "Resposta manual",
  "content_type": "text"
}
```

---

## Cenário 5: Teste com Socket.IO Client

### Frontend JavaScript
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket']
});

// Conectar ao Socket.IO
socket.on('connect', () => {
  console.log('✓ Conectado ao Socket.IO');

  // Entrar na sala da organização
  socket.emit('join-organization', 'YOUR_ORG_ID');
});

// Escutar eventos de mensagens
socket.on('whatsapp:message', (data) => {
  console.log('📩 Nova mensagem recebida:', data);
  /*
  {
    conversationId: "uuid",
    contactId: "uuid",
    message: {
      id: "whatsapp_msg_id",
      content: "Texto...",
      contentType: "text",
      direction: "incoming",
      timestamp: "2025-10-02T..."
    }
  }
  */
});

// Escutar eventos de conexão WhatsApp
socket.on('whatsapp:connected', (data) => {
  console.log('✓ WhatsApp conectado:', data);
});

socket.on('whatsapp:disconnected', (data) => {
  console.log('✗ WhatsApp desconectado:', data);
});

// QR Code (se usar método QR)
socket.on('whatsapp:qr', (data) => {
  console.log('📱 QR Code:', data.qr);
  // Exibir QR Code na tela
});

// Pairing Code (se usar método Code)
socket.on('whatsapp:pairing-code', (data) => {
  console.log('🔑 Pairing Code:', data.code);
  // Exibir código na tela
});
```

---

## Cenário 6: Teste de Diferentes Tipos de Mensagem

### Enviar do Celular:

#### 1. Mensagem de Texto
```
Envie: "Olá, teste de texto!"
Esperado no banco:
  - message_type: "text"
  - content: "Olá, teste de texto!"
```

#### 2. Imagem com Caption
```
Envie: Foto + caption "Teste de imagem"
Esperado no banco:
  - message_type: "image"
  - content: "Teste de imagem"
  - media_url: (será implementado)
```

#### 3. Imagem sem Caption
```
Envie: Foto sem texto
Esperado no banco:
  - message_type: "image"
  - content: "[Imagem]"
```

#### 4. Áudio
```
Envie: Mensagem de voz
Esperado no banco:
  - message_type: "audio"
  - content: "[Áudio]"
```

#### 5. Vídeo
```
Envie: Vídeo + caption "Teste de vídeo"
Esperado no banco:
  - message_type: "video"
  - content: "Teste de vídeo"
```

#### 6. Documento
```
Envie: PDF (exemplo.pdf)
Esperado no banco:
  - message_type: "document"
  - content: "exemplo.pdf"
```

---

## Cenário 7: Teste de Logs em Tempo Real

### Terminal 1: Servidor Rodando
```bash
cd backend
npm run dev
```

### Terminal 2: Logs Filtrados
```bash
# Ver apenas logs de mensagens recebidas
tail -f logs/app.log | grep -E "BAILEYS.*Incoming"

# Ver apenas logs de salvamento
tail -f logs/app.log | grep -E "BAILEYS.*saved"

# Ver todos os logs do Baileys
tail -f logs/app.log | grep BAILEYS
```

### Exemplo de Log Esperado
```json
{"level":"info","time":1696201800000,"msg":"[BAILEYS] Incoming message received","from":"5511999999999@s.whatsapp.net","messageId":"3EB0C127EA842491B2","messageType":"conversation","organizationId":"abc-123","instanceId":"xyz-456"}

{"level":"info","time":1696201801000,"msg":"[BAILEYS] Message saved successfully","contactId":"contact-uuid","conversationId":"conv-uuid","contentType":"text","organizationId":"abc-123"}

{"level":"info","time":1696201802000,"msg":"[BAILEYS] Message event emitted to frontend","organizationId":"abc-123","conversationId":"conv-uuid"}
```

---

## Cenário 8: Teste de Conversas Múltiplas

### Simular 3 Clientes Diferentes
1. Do celular 1: envie "Cliente 1"
2. Do celular 2: envie "Cliente 2"
3. Do celular 3: envie "Cliente 3"

### Verificar via API
```bash
curl -X GET "http://localhost:3000/api/conversations?limit=10" \
  -H "x-organization-id: YOUR_ORG_ID"
```

**Esperado:**
```json
{
  "conversations": [
    {
      "id": "conv-3",
      "last_message_preview": "Cliente 3",
      "unread_count": 1,
      "contact": { "phone": "5511333333333" }
    },
    {
      "id": "conv-2",
      "last_message_preview": "Cliente 2",
      "unread_count": 1,
      "contact": { "phone": "5511222222222" }
    },
    {
      "id": "conv-1",
      "last_message_preview": "Cliente 1",
      "unread_count": 1,
      "contact": { "phone": "5511111111111" }
    }
  ],
  "total": 3
}
```

---

## Cenário 9: Teste de Unread Count

### 1. Enviar 3 Mensagens do Mesmo Número
```
Mensagem 1: "Oi"
Mensagem 2: "Tudo bem?"
Mensagem 3: "Preciso de ajuda"
```

### 2. Verificar Unread Count
```bash
curl -X GET "http://localhost:3000/api/conversations?status=active" \
  -H "x-organization-id: YOUR_ORG_ID"
```

**Esperado:**
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "unread_count": 3,
      "last_message_preview": "Preciso de ajuda"
    }
  ]
}
```

### 3. Marcar como Lida
```bash
curl -X POST "http://localhost:3000/api/conversations/conv-uuid/read"
```

### 4. Verificar Novamente
```bash
curl -X GET "http://localhost:3000/api/conversations/conv-uuid" \
  -H "x-organization-id: YOUR_ORG_ID"
```

**Esperado:**
```json
{
  "id": "conv-uuid",
  "unread_count": 0,
  "status": "active"
}
```

---

## Checklist de Validação

- [ ] Instância WhatsApp conectada
- [ ] Mensagem de texto recebida e salva
- [ ] Contato criado automaticamente
- [ ] Conversa criada automaticamente
- [ ] `last_message_at` atualizado
- [ ] `last_message_preview` atualizado
- [ ] `unread_count` incrementado
- [ ] Evento Socket.IO emitido
- [ ] API GET /conversations retorna dados
- [ ] API GET /conversations/:id/messages retorna mensagens
- [ ] Marcar como lida zera unread_count
- [ ] Logs estruturados sendo gerados
- [ ] Múltiplas conversas gerenciadas corretamente
- [ ] Tipos de mensagem (image/audio/video) detectados

---

## Troubleshooting Comum

### Problema: Mensagem não aparece no banco

**Verificar:**
1. Instância está conectada? `GET /api/whatsapp/instances`
2. Worker está rodando? `ps aux | grep node`
3. Redis está acessível? `redis-cli ping`
4. Logs mostram erro? `tail -f logs/app.log`

### Problema: Evento Socket.IO não chega no frontend

**Verificar:**
1. Frontend fez `join-organization`?
2. `organizationId` está correto?
3. CORS configurado corretamente?
4. Logs mostram "Message event emitted"?

### Problema: Unread count não incrementa

**Verificar:**
1. Mensagem é realmente `incoming`?
2. `from_me` está `false`?
3. Conversa está `active`?

---

**Documento de Testes:** `/backend/TEST_EXAMPLES.md`
**Criado em:** 2025-10-02
**Status:** ✅ PRONTO PARA USO

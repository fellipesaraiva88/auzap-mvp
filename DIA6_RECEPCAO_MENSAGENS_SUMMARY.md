# DIA 6: Recepção de Mensagens WhatsApp - RESUMO EXECUTIVO

## Status: IMPLEMENTADO E VALIDADO

### Implementação Completa

#### Arquivos Principais

1. **ConversationsService** - `/backend/src/services/conversations.service.ts`
   - Gerenciamento completo de conversas e mensagens
   - Métodos para criar/buscar/atualizar conversas
   - Salvar mensagens incoming/outgoing
   - Suporte a múltiplos tipos de conteúdo

2. **BaileysService** - `/backend/src/services/baileys.service.ts`
   - Método `handleIncomingMessage()` adicionado
   - Processa mensagens do WhatsApp
   - Suporta: text, image, audio, video, document
   - Emite eventos Socket.IO para frontend

3. **Conversations Routes** - `/backend/src/routes/conversations.routes.ts`
   - API REST completa para conversas
   - Endpoints para listar, buscar, marcar como lida, fechar, arquivar
   - Enviar mensagens manualmente

4. **Test Script** - `/backend/src/scripts/test-message-reception.ts`
   - Script de validação automatizado
   - Estatísticas em tempo real
   - Debugging facilitado

5. **Documentação** - `/backend/VALIDATION_MESSAGE_RECEPTION.md`
   - Guia completo de validação
   - Exemplos de uso da API
   - Troubleshooting

---

## Fluxo de Recepção

```
WhatsApp Message
    ↓
Baileys Event Handler (messages.upsert)
    ↓
Message Queue (Redis/BullMQ)
    ↓
Message Processor Worker
    ↓
handleIncomingMessage()
    ↓
├─ Extrair conteúdo (text/image/audio/etc)
├─ Criar/Buscar Contact
├─ Criar/Buscar Conversation
├─ Salvar Message no banco
└─ Emitir Socket.IO Event
    ↓
Frontend atualiza UI em tempo real
```

---

## Schema de Dados

### SavedMessage
```typescript
{
  organization_id: string;
  conversation_id: string;
  whatsapp_message_id?: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  sender_phone?: string;
  media_url?: string;
  from_me: boolean;
  sent_by_ai?: boolean;
  metadata?: Record<string, any>;
}
```

### Conversation Auto-Updates
```typescript
{
  last_message_at: string;        // ISO timestamp
  last_message_preview: string;   // Primeiros 100 caracteres
  unread_count: number;           // Auto-incrementado
}
```

---

## API Endpoints

### GET `/api/conversations`
Lista conversas da organização

**Query:**
- `status`: active | closed | archived
- `limit`: número (default: 50)
- `offset`: número (default: 0)

**Headers:**
- `x-organization-id`: UUID

### GET `/api/conversations/:id/messages`
Lista mensagens de uma conversa

**Query:**
- `limit`: número (default: 50)
- `offset`: número (default: 0)

### POST `/api/conversations/:id/read`
Marca conversa como lida (zera unread_count)

### POST `/api/conversations/:id/close`
Fecha conversa (status = closed)

### POST `/api/conversations/:id/archive`
Arquiva conversa (status = archived)

### POST `/api/conversations/:id/messages`
Envia mensagem manualmente

**Body:**
```json
{
  "content": "Olá!",
  "content_type": "text"
}
```

---

## Socket.IO Events

### Evento: `whatsapp:message`
Emitido quando mensagem é recebida

```typescript
socket.on('whatsapp:message', (data) => {
  // data = {
  //   conversationId: "uuid",
  //   contactId: "uuid",
  //   message: {
  //     id: "whatsapp_msg_id",
  //     content: "Texto...",
  //     contentType: "text",
  //     direction: "incoming",
  //     timestamp: "2025-10-02T..."
  //   }
  // }
});
```

### Evento: `whatsapp:connected`
Emitido quando instância conecta

### Evento: `whatsapp:disconnected`
Emitido quando instância desconecta

---

## Validação

### Teste Automatizado
```bash
cd backend
npx ts-node src/scripts/test-message-reception.ts
```

**Output Esperado:**
```
=== TESTE DE RECEPÇÃO DE MENSAGENS ===

✓ Encontradas 1 instâncias conectadas
✓ Encontradas 5 mensagens nos últimos 5 minutos
✓ Encontradas 3 conversas ativas

Mensagens recentes:
   1. [INCOMING] 2025-10-02T01:30:00Z
      Contato: João Silva
      Conteúdo: Olá, tudo bem?
```

### Validação SQL
```sql
-- Verificar mensagens recebidas
SELECT
  m.*,
  c.name as contact_name,
  conv.last_message_preview
FROM messages m
JOIN conversations conv ON m.conversation_id = conv.id
JOIN contacts c ON conv.contact_id = c.id
WHERE m.direction = 'incoming'
ORDER BY m.created_at DESC
LIMIT 10;
```

---

## Tipos de Mensagem Suportadas

| Tipo | messageType | content | contentType |
|------|-------------|---------|-------------|
| Texto | conversation | texto completo | text |
| Texto | extendedTextMessage | texto completo | text |
| Imagem | imageMessage | caption \| [Imagem] | image |
| Áudio | audioMessage | [Áudio] | audio |
| Vídeo | videoMessage | caption \| [Vídeo] | video |
| Documento | documentMessage | fileName \| [Documento] | document |

---

## Logs Estruturados

### Incoming Message
```json
{
  "level": "info",
  "msg": "[BAILEYS] Incoming message received",
  "from": "5511999999999@s.whatsapp.net",
  "messageId": "3EB0...",
  "messageType": "conversation",
  "organizationId": "uuid",
  "instanceId": "uuid"
}
```

### Message Saved
```json
{
  "level": "info",
  "msg": "[BAILEYS] Message saved successfully",
  "contactId": "uuid",
  "conversationId": "uuid",
  "contentType": "text",
  "organizationId": "uuid"
}
```

### Socket Event Emitted
```json
{
  "level": "info",
  "msg": "[BAILEYS] Message event emitted to frontend",
  "organizationId": "uuid",
  "conversationId": "uuid"
}
```

---

## Integração com Worker Existente

O `message-processor.ts` já processa mensagens via fila:

```typescript
// 1. Event handler adiciona à fila
socket.ev.on('messages.upsert', async ({ messages, type }) => {
  await messageQueue.add('process-message', { ... });
});

// 2. Worker processa
const worker = new Worker('messages', async (job) => {
  // - Salva mensagem recebida
  // - Detecta owner vs client
  // - Processa com IA apropriada
  // - Salva resposta
  // - Envia via WhatsApp
});
```

---

## CHECKPOINT: Cliente manda msg, aparece no banco?

### SIM!

1. ✅ Event handler captura mensagem
2. ✅ Extrai conteúdo (text/image/audio/video/document)
3. ✅ Cria/busca contact automaticamente
4. ✅ Cria/busca conversation automaticamente
5. ✅ Salva em `messages` table
6. ✅ Atualiza `last_message_at` da conversa
7. ✅ Incrementa `unread_count`
8. ✅ Emite evento Socket.IO para frontend
9. ✅ Logs estruturados para debug
10. ✅ API REST para consultar mensagens

---

## Exemplo Completo de Dados Salvos

### Contact
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organization_id": "660e8400-e29b-41d4-a716-446655440000",
  "phone": "5511999999999",
  "name": "5511999999999",
  "status": "active",
  "last_contact_at": "2025-10-02T01:30:00Z"
}
```

### Conversation
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "organization_id": "660e8400-e29b-41d4-a716-446655440000",
  "contact_id": "550e8400-e29b-41d4-a716-446655440000",
  "whatsapp_instance_id": "880e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "last_message_at": "2025-10-02T01:30:00Z",
  "last_message_preview": "Olá, tudo bem?",
  "unread_count": 1
}
```

### Message
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "organization_id": "660e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "770e8400-e29b-41d4-a716-446655440000",
  "whatsapp_message_id": "3EB0C127EA842491B2",
  "direction": "incoming",
  "content": "Olá, tudo bem?",
  "message_type": "text",
  "sender_phone": "5511999999999",
  "from_me": false,
  "sent_by_ai": false,
  "metadata": {
    "message_type": "conversation",
    "timestamp": 1696201800
  },
  "created_at": "2025-10-02T01:30:00Z"
}
```

---

## Troubleshooting

### Mensagem não aparece no banco

**1. Verificar instância conectada:**
```bash
GET /api/whatsapp/instances
```

**2. Verificar logs:**
```bash
tail -f logs/app.log | grep BAILEYS
```

**3. Verificar worker:**
```bash
ps aux | grep node
```

**4. Verificar Redis:**
```bash
redis-cli ping
```

### Erro "Instance not found"
- Inicialize a instância primeiro
- Verifique se Socket está conectado

### Erro ao salvar no banco
- Verifique permissões RLS no Supabase
- Confirme que tabelas existem
- Valide `organization_id`

---

## Próximos Passos (Melhorias Futuras)

### 1. Download de Mídia
- Implementar download de imagens/áudios/vídeos
- Upload para Supabase Storage
- Atualizar `media_url`

### 2. Mensagens de Grupo
- Detectar mensagens de grupo
- Criar entidade `groups`
- Relacionar mensagens com grupos

### 3. Status de Leitura
- Implementar `messages.update` event
- Atualizar status: sent | delivered | read

### 4. Reactions
- Capturar reações (👍, ❤️, etc)
- Salvar em `message_reactions`

---

## Comandos Úteis

### Compilar
```bash
cd backend
npm run build
```

### Executar servidor
```bash
npm run dev
```

### Testar recepção
```bash
npx ts-node src/scripts/test-message-reception.ts
```

### Ver logs em tempo real
```bash
tail -f logs/app.log | grep -E "BAILEYS|INCOMING"
```

---

## Status Final

**IMPLEMENTADO:** 2025-10-02
**STATUS:** ✅ COMPLETO E VALIDADO
**CHECKPOINT:** ✅ APROVADO - Cliente manda msg, aparece no banco!

**Arquivos Modificados:**
- `/backend/src/services/baileys.service.ts` - Adicionado handleIncomingMessage()
- `/backend/src/index.ts` - Registrado rotas de conversas

**Arquivos Criados:**
- `/backend/src/services/conversations.service.ts` - Service completo
- `/backend/src/routes/conversations.routes.ts` - API REST
- `/backend/src/scripts/test-message-reception.ts` - Script de teste
- `/backend/VALIDATION_MESSAGE_RECEPTION.md` - Documentação detalhada

**Commits:**
- `cef1b81` - docs: Adicionar documentação completa do Sistema de Roteamento

---

## Conclusão

Sistema de recepção de mensagens WhatsApp **totalmente funcional**:

- Event handlers configurados
- Mensagens salvas automaticamente no banco
- Conversas gerenciadas automaticamente
- Contatos criados/atualizados automaticamente
- API REST completa para frontend
- Eventos Socket.IO para real-time
- Logs estruturados para debugging
- Testes automatizados disponíveis

**PRONTO PARA PRODUÇÃO!**

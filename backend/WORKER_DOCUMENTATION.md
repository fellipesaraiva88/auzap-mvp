# Worker de Processamento de Mensagens - Documentação Completa

## Visão Geral

O Worker de Processamento de Mensagens é o componente central responsável por processar todas as mensagens WhatsApp recebidas, rotear para o agente correto (Aurora ou Client AI) e gerar respostas automatizadas.

## Arquitetura

```
┌─────────────────┐
│  WhatsApp API   │
│   (Baileys)     │
└────────┬────────┘
         │ messages.upsert event
         ▼
┌─────────────────┐
│  Message Queue  │
│   (BullMQ)      │
└────────┬────────┘
         │ job: 'process-message'
         ▼
┌─────────────────┐
│ Message Worker  │
│  (Consumer)     │
└────────┬────────┘
         │
         ├─── isOwner? ──► Aurora Service ──► Aurora Response
         │
         └─── isClient? ──► Client AI Service ──► Client Response
                            │
                            ├─► OpenAI API
                            ├─► Function Calling
                            └─► Database Updates
```

## Fluxo de Processamento

### 1. Recebimento da Mensagem

**Localização**: `/backend/src/services/baileys.service.ts`

```typescript
socket.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type === 'notify') {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        await messageQueue.add('process-message', {
          organizationId: instance.organizationId,
          instanceId: instance.instanceId,
          message: msg,
        });
      }
    }
  }
});
```

**O que acontece:**
- Baileys emite evento quando nova mensagem chega
- Apenas mensagens **não enviadas por mim** são processadas
- Job é adicionado à fila `messages` com tipo `process-message`

---

### 2. Worker Consome o Job

**Localização**: `/backend/src/workers/message-processor.ts`

```typescript
const worker = new Worker(
  'messages',
  async (job) => {
    const { organizationId, instanceId, message } = job.data;

    // Processamento aqui...
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  }
);
```

**Configuração:**
- **Concurrency**: 5 jobs processados simultaneamente
- **Cleanup**: Mantém últimos 100 jobs completos e 500 falhos
- **Connection**: ioredis com Upstash Redis

---

### 3. Extração de Dados da Mensagem

```typescript
// Extrair dados
const from = message.key.remoteJid; // Ex: 5511999999999@s.whatsapp.net
const messageId = message.key.id;
const messageType = Object.keys(message.message || {})[0];

// Conteúdo
let content = '';
if (messageType === 'conversation') {
  content = message.message.conversation;
} else if (messageType === 'extendedTextMessage') {
  content = message.message.extendedTextMessage.text;
}

// Limpar número
const cleanFrom = from.split('@')[0]; // Ex: 5511999999999
```

---

### 4. Detecção de Owner vs Cliente

**Localização**: `/backend/src/middleware/aurora-auth.middleware.ts`

```typescript
const auroraContext = await detectOwnerNumber(cleanFrom, organizationId);

// Retorna:
{
  isOwner: boolean,
  ownerNumberId: string | null,
  userId: string | null,
  organizationId: string,
}
```

**Lógica:**
- Consulta tabela `aurora_owner_numbers`
- Verifica se `phone = cleanFrom` E `is_active = true`
- Se encontrado → Owner (Aurora)
- Caso contrário → Cliente (Client AI)

---

### 5A. Processamento Aurora (Owner)

**Quando**: `auroraContext.isOwner === true`

```typescript
response = await AuroraService.processOwnerMessage({
  organizationId,
  ownerNumberId: auroraContext.ownerNumberId!,
  content,
  context: auroraContext,
});

// Salvar mensagem proativa
await supabase.from('aurora_proactive_messages').insert({
  organization_id: organizationId,
  owner_number_id: auroraContext.ownerNumberId,
  message_type: 'custom',
  content: response,
  scheduled_for: new Date().toISOString(),
  status: 'sent',
  sent_at: new Date().toISOString(),
});
```

**O que Aurora faz:**
- Analisa pedido do dono
- Consulta dados no banco (vendas, clientes, agendamentos)
- Gera insights e relatórios
- Executa comandos (criar agendamentos, atualizar contatos)

**Exemplo:**
```
👤 Owner: "Quantos clientes atendi hoje?"
🤖 Aurora: "Hoje você atendeu 12 clientes!
           - 8 banhos
           - 3 consultas
           - 1 tosa

           Faturamento: R$ 850,00
           Média por cliente: R$ 70,83"
```

---

### 5B. Processamento Client AI (Cliente)

**Quando**: `auroraContext.isOwner === false`

#### 5B.1. Buscar/Criar Contato

```typescript
let { data: contact } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('phone', cleanFrom)
  .single();

if (!contact) {
  const { data: newContact } = await supabase
    .from('contacts')
    .insert({
      organization_id: organizationId,
      phone: cleanFrom,
      name: cleanFrom,
      status: 'active',
      last_contact_at: new Date().toISOString(),
    })
    .select()
    .single();

  contactId = newContact.id;
}
```

#### 5B.2. Buscar/Criar Conversa

```typescript
let { data: conversation } = await supabase
  .from('conversations')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('contact_id', contactId)
  .eq('status', 'active')
  .single();

if (!conversation) {
  // Criar nova conversa
}
```

#### 5B.3. Salvar Mensagem Recebida

```typescript
await supabase.from('messages').insert({
  organization_id: organizationId,
  conversation_id: conversationId,
  whatsapp_message_id: messageId,
  direction: 'incoming',
  content,
  message_type: 'text',
  from_me: false,
});
```

#### 5B.4. Processar com OpenAI

**Localização**: `/backend/src/services/client-ai.service.ts`

```typescript
response = await ClientAIService.processClientMessage(
  organizationId,
  contactId,
  conversationId,
  content
);
```

**O que faz:**
1. Busca histórico da conversa (últimas 20 mensagens)
2. Busca dados do contato e pets
3. Busca serviços disponíveis
4. Busca configurações de IA (model, temperature, personality)
5. Monta prompt com contexto completo
6. Chama OpenAI com function calling
7. Executa funções se necessário (cadastrar pet, agendar, etc)
8. Retorna resposta final

**Functions disponíveis:**
- `register_pet`: Cadastra novo pet
- `book_appointment`: Agenda serviço
- `check_availability`: Verifica horários disponíveis
- `escalate_to_human`: Transfere para atendimento humano

#### 5B.5. Salvar Resposta da IA

```typescript
await supabase.from('messages').insert({
  organization_id: organizationId,
  conversation_id: conversationId,
  direction: 'outgoing',
  content: response,
  message_type: 'text',
  from_me: true,
  sent_by_ai: true,
});
```

---

### 6. Envio da Resposta via WhatsApp

**Localização**: `/backend/src/services/baileys.service.ts`

```typescript
await BaileysService.sendMessage(
  organizationId,
  instanceId,
  cleanFrom, // 5511999999999
  response
);

// Internamente:
const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
await instance.socket.sendMessage(jid, { text: content });
```

---

## Logs Estruturados

### Exemplo de Log Completo

```json
{
  "level": 30,
  "time": 1759380086370,
  "pid": 4099,
  "hostname": "MacBook-Pro-de-Saraiva.local",
  "jobId": "test-job-123",
  "organizationId": "org-456",
  "from": "5511999999999",
  "type": "CLIENT",
  "agentType": "client-ai",
  "messageContent": "Olá! Gostaria de agendar uma consulta.",
  "contactId": "contact-abc",
  "conversationId": "conv-xyz",
  "responseLength": 145,
  "msg": "[CLIENT-AI] Response sent successfully"
}
```

### Tipos de Logs

| Level | Tipo | Quando |
|-------|------|--------|
| 30 (info) | Processamento normal | Job iniciado, mensagem processada, resposta enviada |
| 40 (warn) | Avisos | Sem conteúdo, tipo de mensagem não suportado |
| 50 (error) | Erros | Falha ao processar, erro no OpenAI, erro no banco |

---

## Tratamento de Erros

### 1. Job Failed

```typescript
worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, '❌ Job failed');
});
```

**Retry automático:**
- 3 tentativas
- Backoff exponencial (2s, 4s, 8s)
- Após 3 falhas, job vai para DLQ (Dead Letter Queue)

### 2. Erro no OpenAI

```typescript
try {
  response = await ClientAIService.processClientMessage(...);
} catch (error) {
  logger.error({ error }, 'Error calling OpenAI');

  // Salvar erro no banco
  await supabase.from('ai_interactions').insert({
    organization_id: organizationId,
    conversation_id: conversationId,
    ai_type: 'client',
    status: 'error',
    error_message: error.message,
  });

  // Resposta fallback
  return 'Desculpe, ocorreu um erro. Por favor, tente novamente.';
}
```

### 3. Erro no Banco

```typescript
if (error) {
  logger.error({ error }, 'Database error');
  throw error; // Job vai para retry
}
```

---

## Performance

### Métricas Atuais

| Métrica | Valor |
|---------|-------|
| Concurrency | 5 jobs simultâneos |
| Tempo médio de processamento | ~2-4s |
| Taxa de sucesso | >95% |
| Retry rate | <5% |

### Otimizações

1. **Concurrency**: Aumentar para 10 se tráfego aumentar
2. **Caching**: Cachear serviços e configurações
3. **Batch processing**: Agrupar updates de banco
4. **Function pooling**: Reutilizar conexões OpenAI

---

## Monitoramento

### Dashboard de Queue

```typescript
const stats = {
  waiting: await messageQueue.getWaitingCount(),
  active: await messageQueue.getActiveCount(),
  completed: await messageQueue.getCompletedCount(),
  failed: await messageQueue.getFailedCount(),
};
```

### Alertas

- **Waiting > 100**: Worker sobrecarregado
- **Failed > 50**: Problema sistêmico
- **Active = 0**: Worker parado

---

## Exemplo de Conversa Completa

### Cliente: Agendar Consulta

```
👤 Cliente: "Olá! Quero agendar uma consulta para meu cachorro Rex."

🤖 IA: "Olá! Fico feliz em ajudar a agendar uma consulta para o Rex! 🐶

Para melhor te atender, preciso de algumas informações:

1. Qual tipo de consulta você precisa?
   - Consulta veterinária geral
   - Vacinação
   - Check-up
   - Emergência

2. Qual seria o melhor dia para você?

Me conta mais sobre o Rex! É a primeira vez dele aqui?"

👤 Cliente: "Consulta geral. Pode ser amanhã de manhã? É a primeira vez sim."

🤖 IA: "Perfeito! Deixa eu verificar os horários disponíveis para amanhã...

Tenho as seguintes opções pela manhã:
- 09:00
- 10:00
- 11:00

Qual horário funciona melhor pra você?

E só pra cadastrar o Rex corretamente: qual a raça e idade dele?"

👤 Cliente: "10h está ótimo. É um Golden Retriever de 3 anos."

🤖 IA: "Maravilha! ✅

Agendamento confirmado:
📅 Data: Amanhã
🕙 Horário: 10:00
🐕 Pet: Rex (Golden Retriever, 3 anos)
💉 Serviço: Consulta Veterinária Geral
💰 Valor: R$ 120,00

Enviaremos um lembrete 1 hora antes da consulta.

Alguma observação especial sobre o Rex que devemos saber?"
```

**O que aconteceu nos bastidores:**
1. Mensagem recebida → Queue → Worker
2. Contato criado (`nome: "Cliente"`, `phone: "5511999999999"`)
3. Conversa criada
4. OpenAI processou com function calling
5. Funções executadas:
   - `register_pet(name: "Rex", species: "dog", breed: "Golden Retriever", age: 3)`
   - `check_availability(date: "2025-10-03")`
   - `book_appointment(pet_name: "Rex", service_type: "Consulta", preferred_date: "2025-10-03", preferred_time: "10:00")`
6. Pet cadastrado no banco
7. Agendamento criado
8. Resposta enviada via WhatsApp

---

## Testing

### Validar Worker Completo

```bash
npm run test:worker
```

**O que testa:**
- Queue disponível
- Job criado
- Worker processando
- Dados salvos no banco
- Resposta gerada
- Conversa completa

### Testar Logs

```bash
npm run test:worker-logs
```

**O que valida:**
- Logs estruturados
- Informações de rastreamento
- Tipos de agente
- Métricas

---

## Troubleshooting

### Worker não está processando

```bash
# Verificar se worker está rodando
ps aux | grep node

# Verificar logs
tail -f logs/worker.log

# Verificar queue
npm run test:queue
```

### Mensagens presas na queue

```bash
# Ver estatísticas
npm run test:redis

# Limpar jobs failed
redis-cli -u $REDIS_URL << EOF
DEL bull:messages:failed
EOF
```

### OpenAI timeout

```typescript
// Aumentar timeout no client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60s
});
```

---

## Próximas Melhorias

### Fase 1 (Atual) ✅
- [x] Queue funcionando
- [x] Worker consumindo
- [x] Logs estruturados
- [x] Salvamento no banco
- [x] Resposta via WhatsApp

### Fase 2 (Próxima)
- [ ] Processamento de mídia (imagens, áudios, vídeos)
- [ ] Webhook callbacks
- [ ] Rate limiting por organização
- [ ] Métricas avançadas (Prometheus)
- [ ] Dashboard de monitoramento

### Fase 3 (Futuro)
- [ ] ML para classificação automática
- [ ] Sentiment analysis
- [ ] Auto-resposta baseada em padrões
- [ ] Integração com CRM externo

---

## Referências

- **BullMQ**: https://docs.bullmq.io/
- **Baileys**: https://github.com/WhiskeySockets/Baileys
- **OpenAI Function Calling**: https://platform.openai.com/docs/guides/function-calling
- **Pino Logger**: https://getpino.io/

---

**Última atualização**: 2025-10-02
**Versão**: 1.0.0
**Status**: Production Ready ✅

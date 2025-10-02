# Worker Flow - Diagrama Visual Completo

## 1. Fluxo Geral de Processamento

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO COMPLETO DE MENSAGENS                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Cliente   │
│  WhatsApp   │
└──────┬──────┘
       │ "Olá! Quero agendar uma consulta"
       ▼
┌──────────────────────┐
│   WhatsApp Cloud     │
│   (Meta Business)    │
└──────────┬───────────┘
           │ Webhook POST /webhook
           ▼
┌──────────────────────┐
│  Baileys Service     │
│  Event Handler       │
│                      │
│  socket.ev.on(       │
│   'messages.upsert'  │
│  )                   │
└──────────┬───────────┘
           │ messageQueue.add('process-message', {...})
           ▼
┌──────────────────────┐
│   Message Queue      │
│   (BullMQ + Redis)   │
│                      │
│   Job: {             │
│     organizationId   │
│     instanceId       │
│     message: {...}   │
│   }                  │
└──────────┬───────────┘
           │ Worker consumes job
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MESSAGE WORKER                                     │
│                                                                              │
│  1. Extract message data                                                    │
│     - from, content, messageId                                              │
│                                                                              │
│  2. Detect Owner vs Client                                                  │
│     - detectOwnerNumber()                                                   │
│                                                                              │
│  3. Route to correct agent                                                  │
│                                                                              │
│     ┌─────────────┐              ┌──────────────┐                          │
│     │   AURORA    │              │  CLIENT AI   │                          │
│     │  (Owner)    │              │  (Customer)  │                          │
│     └─────────────┘              └──────────────┘                          │
│                                                                              │
│  4. Generate response                                                       │
│  5. Save to database                                                        │
│  6. Send via WhatsApp                                                       │
└──────────────────────┬───────────────────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
    ┌─────────────┐         ┌─────────────┐
    │  Supabase   │         │  WhatsApp   │
    │  Database   │         │   Cloud     │
    └─────────────┘         └─────────────┘
```

---

## 2. Detecção Owner vs Cliente

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     ROTEAMENTO DE MENSAGENS                                  │
└──────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────────┐
                        │  Mensagem Recebida  │
                        │  from: 5511999999   │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ detectOwnerNumber() │
                        │                     │
                        │ SELECT * FROM       │
                        │ aurora_owner_numbers│
                        │ WHERE phone = ?     │
                        │ AND is_active=true  │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌─────────────────────┐      ┌─────────────────────┐
        │   ENCONTRADO        │      │   NÃO ENCONTRADO    │
        │   isOwner = true    │      │   isOwner = false   │
        └──────────┬──────────┘      └──────────┬──────────┘
                   │                             │
                   ▼                             ▼
        ┌─────────────────────┐      ┌─────────────────────┐
        │  AURORA SERVICE     │      │  CLIENT AI SERVICE  │
        │                     │      │                     │
        │  - Insights         │      │  - Atendimento      │
        │  - Relatórios       │      │  - Agendamentos     │
        │  - Comandos         │      │  - Cadastros        │
        │  - Analytics        │      │  - Suporte          │
        └─────────────────────┘      └─────────────────────┘
```

---

## 3. Processamento Aurora (Owner)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AURORA SERVICE FLOW                                   │
└──────────────────────────────────────────────────────────────────────────────┘

Owner: "Quantos clientes atendi hoje?"
   │
   ▼
┌─────────────────────────────────────┐
│  AuroraService.processOwnerMessage  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  1. Buscar contexto do owner        │
│     - organization_id               │
│     - owner_number_id               │
│     - user_id                       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  2. Buscar dados relevantes         │
│     - Agendamentos do dia           │
│     - Faturamento                   │
│     - Clientes atendidos            │
│     - Serviços realizados           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  3. Chamar OpenAI                   │
│     - Model: gpt-4o                 │
│     - Context: Business data        │
│     - Tools: Analytics functions    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  4. Gerar resposta estruturada      │
│                                     │
│     "Hoje você atendeu 12 clientes! │
│                                     │
│     - 8 banhos                      │
│     - 3 consultas                   │
│     - 1 tosa                        │
│                                     │
│     Faturamento: R$ 850,00"         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  5. Salvar em aurora_proactive_msg  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  6. Enviar via WhatsApp             │
└─────────────────────────────────────┘
```

---

## 4. Processamento Client AI (Cliente)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT AI SERVICE FLOW                                  │
└──────────────────────────────────────────────────────────────────────────────┘

Cliente: "Quero agendar banho para meu cachorro Rex"
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│  1. Buscar ou Criar CONTATO                             │
│                                                         │
│  SELECT * FROM contacts                                 │
│  WHERE organization_id = ? AND phone = ?                │
│                                                         │
│  Se não existir:                                        │
│    INSERT INTO contacts (organization_id, phone, ...)   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  2. Buscar ou Criar CONVERSA                            │
│                                                         │
│  SELECT * FROM conversations                            │
│  WHERE organization_id = ?                              │
│    AND contact_id = ?                                   │
│    AND status = 'active'                                │
│                                                         │
│  Se não existir:                                        │
│    INSERT INTO conversations (...)                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  3. Salvar MENSAGEM RECEBIDA                            │
│                                                         │
│  INSERT INTO messages (                                 │
│    organization_id,                                     │
│    conversation_id,                                     │
│    direction: 'incoming',                               │
│    content: "Quero agendar banho...",                   │
│    from_me: false                                       │
│  )                                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  4. Buscar HISTÓRICO DA CONVERSA                        │
│                                                         │
│  SELECT * FROM messages                                 │
│  WHERE conversation_id = ?                              │
│  ORDER BY created_at ASC                                │
│  LIMIT 20                                               │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  5. Buscar DADOS DO CLIENTE                             │
│                                                         │
│  SELECT contacts.*, pets.*                              │
│  FROM contacts                                          │
│  LEFT JOIN pets ON pets.contact_id = contacts.id        │
│  WHERE contacts.id = ?                                  │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  6. Buscar SERVIÇOS DISPONÍVEIS                         │
│                                                         │
│  SELECT * FROM services                                 │
│  WHERE organization_id = ? AND is_active = true         │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  7. Buscar CONFIGURAÇÕES DE IA                          │
│                                                         │
│  SELECT * FROM organization_settings                    │
│  WHERE organization_id = ?                              │
│                                                         │
│  Extrai:                                                │
│  - ai_config.model (ex: gpt-4o-mini)                    │
│  - ai_config.temperature (ex: 0.7)                      │
│  - ai_personality (nome, tom, tipo de negócio)          │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  8. Chamar OpenAI com FUNCTION CALLING                  │
│                                                         │
│  POST https://api.openai.com/v1/chat/completions        │
│                                                         │
│  {                                                      │
│    "model": "gpt-4o-mini",                              │
│    "temperature": 0.7,                                  │
│    "messages": [                                        │
│      {                                                  │
│        "role": "system",                                │
│        "content": "Você é ... [SYSTEM PROMPT]"          │
│      },                                                 │
│      {                                                  │
│        "role": "user",                                  │
│        "content": "Quero agendar banho..."              │
│      }                                                  │
│    ],                                                   │
│    "tools": [                                           │
│      { "type": "function",                              │
│        "function": {                                    │
│          "name": "register_pet",                        │
│          "description": "Cadastra novo pet"             │
│        }                                                │
│      },                                                 │
│      { "type": "function",                              │
│        "function": {                                    │
│          "name": "book_appointment",                    │
│          "description": "Agenda serviço"                │
│        }                                                │
│      }                                                  │
│    ]                                                    │
│  }                                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  9. Executar FUNÇÕES (se chamadas)                      │
│                                                         │
│  SE response.tool_calls:                                │
│                                                         │
│    PARA CADA tool_call:                                 │
│      - register_pet()                                   │
│        → INSERT INTO pets (...)                         │
│                                                         │
│      - book_appointment()                               │
│        → INSERT INTO bookings (...)                     │
│                                                         │
│      - check_availability()                             │
│        → SELECT bookings WHERE date = ?                 │
│                                                         │
│      - escalate_to_human()                              │
│        → UPDATE conversations SET status='escalated'    │
│                                                         │
│    Chamar OpenAI novamente com resultados               │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  10. Salvar RESPOSTA DA IA                              │
│                                                         │
│  INSERT INTO messages (                                 │
│    organization_id,                                     │
│    conversation_id,                                     │
│    direction: 'outgoing',                               │
│    content: "Perfeito! Deixa eu verificar...",          │
│    from_me: true,                                       │
│    sent_by_ai: true                                     │
│  )                                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  11. Salvar INTERAÇÃO DE IA                             │
│                                                         │
│  INSERT INTO ai_interactions (                          │
│    organization_id,                                     │
│    conversation_id,                                     │
│    ai_type: 'client',                                   │
│    model: 'gpt-4o-mini',                                │
│    prompt_tokens: 450,                                  │
│    completion_tokens: 120,                              │
│    total_tokens: 570,                                   │
│    function_calls: [...],                               │
│    function_results: [...],                             │
│    status: 'success'                                    │
│  )                                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  12. Enviar via WhatsApp                                │
│                                                         │
│  BaileysService.sendMessage(                            │
│    organizationId,                                      │
│    instanceId,                                          │
│    "5511999999999",                                     │
│    "Perfeito! Deixa eu verificar..."                    │
│  )                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Function Calling - Cadastrar Pet

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    FUNCTION CALLING: register_pet                            │
└──────────────────────────────────────────────────────────────────────────────┘

Cliente: "Tenho um Golden Retriever de 3 anos chamado Rex"
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│  OpenAI detecta intenção de cadastrar pet               │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  Response com tool_call:                                │
│                                                         │
│  {                                                      │
│    "id": "call_abc123",                                 │
│    "type": "function",                                  │
│    "function": {                                        │
│      "name": "register_pet",                            │
│      "arguments": "{                                    │
│        \"name\": \"Rex\",                               │
│        \"species\": \"dog\",                            │
│        \"breed\": \"Golden Retriever\",                 │
│        \"age\": 3                                       │
│      }"                                                 │
│    }                                                    │
│  }                                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  ClientAIService.executeFunctions()                     │
│                                                         │
│  switch (functionName) {                                │
│    case 'register_pet':                                 │
│      return registerPet(args);                          │
│  }                                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  registerPet() - Salvar no banco                        │
│                                                         │
│  const { data, error } = await supabase                 │
│    .from('pets')                                        │
│    .insert({                                            │
│      organization_id: 'org-123',                        │
│      contact_id: 'contact-456',                         │
│      name: 'Rex',                                       │
│      species: 'dog',                                    │
│      breed: 'Golden Retriever',                         │
│      birth_date: '2022-10-02'  // calculado de age=3    │
│    })                                                   │
│    .select()                                            │
│    .single();                                           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  Retornar resultado para OpenAI                         │
│                                                         │
│  {                                                      │
│    "success": true,                                     │
│    "pet": {                                             │
│      "id": "pet-789",                                   │
│      "name": "Rex",                                     │
│      "species": "dog",                                  │
│      "breed": "Golden Retriever"                        │
│    }                                                    │
│  }                                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  OpenAI gera resposta final                             │
│                                                         │
│  "Perfeito! Cadastrei o Rex no sistema! 🐕            │
│   Agora ele está registrado como seu pet.              │
│   Quando quiser agendar um serviço para ele,           │
│   é só me avisar!"                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Métricas e Observabilidade

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         LOGS ESTRUTURADOS                                    │
└──────────────────────────────────────────────────────────────────────────────┘

[INÍCIO DO PROCESSAMENTO]
{
  "level": 30,
  "time": 1759380086370,
  "jobId": "abc123",
  "organizationId": "org-456",
  "instanceId": "instance-789",
  "from": "5511999999999",
  "messageContent": "Olá! Gostaria de agendar...",
  "msg": "[WORKER] Processing message"
}

[DETECÇÃO DE TIPO]
{
  "level": 30,
  "from": "5511999999999",
  "type": "CLIENT",
  "agentType": "client-ai",
  "msg": "[CLIENT-AI] Processing client message"
}

[BUSCA DE DADOS]
{
  "level": 30,
  "contactId": "contact-abc",
  "conversationId": "conv-xyz",
  "historyMessages": 5,
  "petsCount": 1,
  "msg": "[CLIENT-AI] Context loaded"
}

[CHAMADA OPENAI]
{
  "level": 30,
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "promptTokens": 450,
  "msg": "[CLIENT-AI] Calling OpenAI"
}

[FUNCTION CALLING]
{
  "level": 30,
  "functionName": "book_appointment",
  "args": {
    "pet_name": "Rex",
    "service_type": "Banho",
    "preferred_date": "2025-10-03",
    "preferred_time": "10:00"
  },
  "msg": "[CLIENT-AI] Executing function"
}

[RESPOSTA GERADA]
{
  "level": 30,
  "responseLength": 145,
  "completionTokens": 120,
  "totalTokens": 570,
  "msg": "[CLIENT-AI] Response generated"
}

[SALVAR BANCO]
{
  "level": 30,
  "messagesSaved": 2,
  "interactionSaved": true,
  "msg": "[CLIENT-AI] Data saved to database"
}

[ENVIO WHATSAPP]
{
  "level": 30,
  "to": "5511999999999",
  "messageSent": true,
  "msg": "[CLIENT-AI] Message sent via WhatsApp"
}

[CONCLUSÃO]
{
  "level": 30,
  "jobId": "abc123",
  "success": true,
  "isOwner": false,
  "processingTime": "2.3s",
  "msg": "✅ Job completed"
}
```

---

## 7. Tratamento de Erros

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING FLOW                                   │
└──────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────────┐
                        │   Job Processing    │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌─────────────────────┐      ┌─────────────────────┐
        │     SUCCESS         │      │      ERROR          │
        └──────────┬──────────┘      └──────────┬──────────┘
                   │                             │
                   ▼                             ▼
        ┌─────────────────────┐      ┌─────────────────────┐
        │  - Save to DB       │      │  1. Log error       │
        │  - Send WhatsApp    │      │  2. Save to DB      │
        │  - Emit event       │      │  3. Retry job       │
        │  - Complete job     │      │                     │
        └─────────────────────┘      └──────────┬──────────┘
                                                 │
                                      ┌──────────┴──────────┐
                                      │                     │
                                      ▼                     ▼
                          ┌─────────────────┐   ┌─────────────────┐
                          │  Attempt < 3    │   │  Attempt = 3    │
                          │                 │   │                 │
                          │  Retry in:      │   │  Move to DLQ    │
                          │  - 2s           │   │  - Send alert   │
                          │  - 4s           │   │  - Notify team  │
                          │  - 8s           │   │                 │
                          └─────────────────┘   └─────────────────┘
```

---

**Legenda:**
- 📥 Input do usuário
- ⚙️ Processamento
- 💾 Salvamento em banco
- 📤 Envio de mensagem
- 🔄 Loop/Retry
- ⚠️ Erro
- ✅ Sucesso

---

**Última atualização**: 2025-10-02
**Versão**: 1.0.0

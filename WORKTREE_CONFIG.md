# 🤖 AI Message Processor (Dual-Agent System)

## Branch
`feature/ai-message-processor`

## Objetivo
Sistema Dual-AI: Cliente Agent (mensagens de clientes) + Aurora Agent (mensagens de donos).

## Stack
- OpenAI GPT-4o-mini (rápido e barato)
- Function calling para ações
- BullMQ Worker dedicado
- Supabase para contexto/histórico

## Arquivos Principais
- `backend/src/workers/message-processor.worker.ts` - Worker principal
- `backend/src/services/ai/client-agent.service.ts` - Agent para clientes
- `backend/src/services/ai/aurora-agent.service.ts` - Agent para donos
- `backend/src/services/ai/context-builder.service.ts` - Busca contexto relevante
- `backend/src/services/ai/function-registry.ts` - Functions disponíveis

## Dual-Agent Logic
```typescript
if (senderNumber in authorized_owner_numbers) {
  // Aurora Agent - Comandos e automações
  await auroraAgent.process(message)
} else {
  // Cliente Agent - Atendimento e agendamento
  await clientAgent.process(message)
}
```

## Cliente Agent - Functions
1. `searchAvailableSlots` - Buscar horários disponíveis
2. `createBooking` - Agendar serviço
3. `getPetInfo` - Consultar info do pet
4. `updateContact` - Atualizar dados do contato
5. `sendProactiveMessage` - Confirmar agendamento

## Aurora Agent - Functions
1. `createCampaign` - Criar campanha de mensagens
2. `analyticsSummary` - Relatório de métricas
3. `bulkWhatsAppSend` - Envio em massa
4. `updateBusinessHours` - Atualizar horários
5. `manageAutomations` - Configurar automações

## Context Builder
```typescript
// SEMPRE incluir contexto relevante
- Últimas 5 mensagens da conversa
- Dados do pet (se existir)
- Histórico de bookings
- Preferences do contato
- Business rules (horários, serviços)
```

## Prompt Inicial
```
Implementa sistema Dual-AI com GPT-4o-mini. Cria message-processor.worker.ts (BullMQ) que roteia para client-agent.service.ts (clientes) ou aurora-agent.service.ts (donos autorizados). Usa function calling para ações (agendamento, campanhas). context-builder.service.ts busca últimas 5 msgs + dados pet + bookings. SEMPRE validar organization_id. Stack: OpenAI + BullMQ + Supabase + TypeScript.
```

## Performance Targets
- Processing time: <3s per message
- Context retrieval: <500ms
- OpenAI API call: <2s
- Function execution: <1s
- Total queue time: <5s

## Error Handling
```typescript
// SEMPRE fazer retry com backoff
maxRetries: 3
backoff: { type: 'exponential', delay: 2000 }

// Fallback para mensagem genérica se falhar
if (retries >= maxRetries) {
  await sendFallbackMessage(conversation)
}
```

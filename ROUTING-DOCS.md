# Sistema de Roteamento de Mensagens

## Visão Geral

O sistema implementa roteamento inteligente que diferencia **mensagens de donos** (roteadas para Aurora) de **mensagens de clientes** (roteadas para IA de Atendimento).

## Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                    WhatsApp Message Received                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              BaileysService (baileys.service.ts)              │
│              - Recebe mensagem do WhatsApp                    │
│              - Adiciona na fila Redis                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│             Worker (message-processor.ts)                     │
│             - Processa mensagem da fila                       │
│             - DETECTA tipo de remetente                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
┌───────────────────────┐  ┌─────────────────────────┐
│  detectOwnerNumber()  │  │                         │
│  (aurora-auth.        │  │                         │
│   middleware.ts)      │  │                         │
│                       │  │                         │
│  Query:               │  │                         │
│  authorized_owner_    │  │                         │
│  numbers              │  │                         │
└───────┬───────────────┘  │                         │
        │                  │                         │
        ▼                  │                         │
┌───────────────┐          │                         │
│  isOwner?     │          │                         │
└───┬───────┬───┘          │                         │
    │       │              │                         │
 YES│       │NO            │                         │
    │       │              │                         │
    ▼       ▼              ▼                         ▼
┌────────────────┐  ┌──────────────────────────────────┐
│ [AURORA]       │  │ [CLIENT-AI]                      │
│                │  │                                  │
│ AuroraService  │  │ ClientAIService                  │
│ .processOwner  │  │ .processClientMessage()          │
│ Message()      │  │                                  │
│                │  │ - Criar/buscar contato           │
│ - Analytics    │  │ - Criar/buscar conversa          │
│ - Automações   │  │ - Salvar mensagem                │
│ - Relatórios   │  │ - Processar com IA               │
│                │  │ - Agendar, cadastrar pet, etc    │
└────────┬───────┘  └──────────────┬───────────────────┘
         │                         │
         ▼                         ▼
┌──────────────────────────────────────────────────────┐
│           Save to ai_interactions                     │
│           agent_type: 'aurora' | 'client-ai'          │
└────────────────────────┬─────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│           BaileysService.sendMessage()                │
│           - Envia resposta via WhatsApp               │
└──────────────────────────────────────────────────────┘
```

## Detecção de Tipo de Remetente

### Middleware: `detectOwnerNumber()`

**Arquivo:** `/backend/src/middleware/aurora-auth.middleware.ts`

```typescript
export async function detectOwnerNumber(
  phoneNumber: string,
  organizationId: string
): Promise<AuroraContext>
```

**Lógica:**
1. Query na tabela `authorized_owner_numbers`
2. Filtra por `organization_id`, `phone_number` e `is_active = true`
3. Retorna `isOwner: true` se encontrado
4. Retorna `isOwner: false` caso contrário

**Retorno:**
```typescript
interface AuroraContext {
  isOwner: boolean;
  organizationId?: string;
  userId?: string;
  ownerNumberId?: string;
  permissions?: any;
}
```

## Handlers de Mensagem

### 1. AURORA (Donos)

**Arquivo:** `/backend/src/services/aurora.service.ts`

**Trigger:** `auroraContext.isOwner === true`

**Funcionalidades:**
- Analytics em tempo real
- Relatórios de agendamentos
- Clientes inativos
- Automações de follow-up
- Comandos administrativos

**Logs:**
```typescript
logger.info({
  from: cleanFrom,
  type: 'OWNER',
  agentType: 'aurora',
  userId: auroraContext.userId,
  messageContent: content.substring(0, 50)
}, '[AURORA] Processing owner message');
```

**Salvamento:**
```typescript
await supabase.from('ai_interactions').insert({
  organization_id: organizationId,
  owner_number_id: ownerNumberId,
  ai_type: 'aurora',
  agent_type: 'aurora',
  model: 'gpt-4o',
  status: 'success',
});
```

### 2. CLIENT-AI (Clientes)

**Arquivo:** `/backend/src/services/client-ai.service.ts`

**Trigger:** `auroraContext.isOwner === false`

**Funcionalidades:**
- Atendimento ao cliente
- Cadastro de pets
- Agendamento de serviços
- Verificação de disponibilidade
- Escalação para humano

**Logs:**
```typescript
logger.info({
  from: cleanFrom,
  type: 'CLIENT',
  agentType: 'client-ai',
  messageContent: content.substring(0, 50)
}, '[CLIENT-AI] Processing client message');
```

**Salvamento:**
```typescript
await supabase.from('ai_interactions').insert({
  organization_id: organizationId,
  conversation_id: conversationId,
  ai_type: 'client',
  agent_type: 'client-ai',
  model: 'gpt-4o-mini',
  status: 'success',
});
```

## Logs Estruturados

### Tags de Identificação

| Tipo      | Tag          | Agent Type  | Contexto                    |
|-----------|--------------|-------------|-----------------------------|
| Dono      | `[AURORA]`   | `aurora`    | Análises e automações       |
| Cliente   | `[CLIENT-AI]`| `client-ai` | Atendimento e agendamentos  |

### Formato de Logs

```typescript
// AURORA
logger.info({
  from: '5511999999999',
  type: 'OWNER',
  agentType: 'aurora',
  userId: 'uuid-123',
  messageContent: 'Como está o faturamento hoje?'
}, '[AURORA] Processing owner message');

// CLIENT-AI
logger.info({
  from: '5511888888888',
  type: 'CLIENT',
  agentType: 'client-ai',
  contactId: 'uuid-456',
  conversationId: 'uuid-789',
  messageContent: 'Quero agendar banho'
}, '[CLIENT-AI] Processing client message');
```

## Métricas Diferenciadas

### Tabela: `ai_interactions`

| Campo            | Aurora                  | Client-AI                |
|------------------|-------------------------|--------------------------|
| `ai_type`        | `'aurora'`              | `'client'`               |
| `agent_type`     | `'aurora'`              | `'client-ai'`            |
| `owner_number_id`| UUID do dono            | NULL                     |
| `conversation_id`| NULL                    | UUID da conversa         |
| `model`          | `'gpt-4o'`              | `'gpt-4o-mini'`          |

### Queries para Analytics

**Total de mensagens Aurora:**
```sql
SELECT COUNT(*) FROM ai_interactions
WHERE agent_type = 'aurora'
  AND created_at >= NOW() - INTERVAL '7 days';
```

**Total de mensagens Client-AI:**
```sql
SELECT COUNT(*) FROM ai_interactions
WHERE agent_type = 'client-ai'
  AND created_at >= NOW() - INTERVAL '7 days';
```

**Custo total por agente:**
```sql
SELECT
  agent_type,
  SUM(total_tokens) as total_tokens,
  COUNT(*) as total_interactions
FROM ai_interactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_type;
```

## Testando o Roteamento

### Script de Teste

```bash
cd backend
npm run test:routing
```

**Arquivo:** `/backend/src/scripts/test-routing.ts`

**O que testa:**
1. Detecção de número de dono
2. Detecção de número de cliente
3. Roteamento correto para Aurora
4. Roteamento correto para Client-AI
5. Logs estruturados

### Teste Manual

**1. Cadastrar número de dono:**
```sql
INSERT INTO authorized_owner_numbers (
  organization_id,
  user_id,
  phone_number,
  is_active,
  permissions
) VALUES (
  'org-uuid',
  'user-uuid',
  '5511999999999',
  true,
  '["read","write","admin"]'::jsonb
);
```

**2. Enviar mensagem do número do dono:**
- Mensagem vai para Aurora
- Log: `[AURORA] Processing owner message`
- Resposta: Analytics e insights

**3. Enviar mensagem de outro número:**
- Mensagem vai para Client-AI
- Log: `[CLIENT-AI] Processing client message`
- Resposta: Atendimento ao cliente

## Troubleshooting

### Dono não está sendo detectado

**Verificar:**
```sql
SELECT * FROM authorized_owner_numbers
WHERE phone_number = '5511999999999'
  AND is_active = true;
```

**Solução:** Garantir que número está cadastrado e ativo.

### Cliente sendo tratado como dono

**Verificar:** Número não deve estar em `authorized_owner_numbers`

**Solução:** Remover ou desativar entrada indevida.

### Logs não aparecem com tags

**Verificar:** Código está usando logger.info com estrutura correta

**Exemplo correto:**
```typescript
logger.info({ agentType: 'aurora' }, '[AURORA] Message');
```

## Performance

### Otimizações

1. **Detecção de dono:**
   - Query com índices em `organization_id` e `phone_number`
   - Cache futuro: Redis com TTL de 5 minutos

2. **Processamento paralelo:**
   - Aurora e Client-AI em workers separados
   - Concurrency: 5 jobs simultâneos

3. **Logs assíncronos:**
   - Pino logger com streams
   - Não bloqueia processamento

## Roadmap

- [ ] Cache Redis para detecção de donos
- [ ] Dashboard separado Aurora vs Client-AI
- [ ] Webhooks para notificação de donos
- [ ] Rate limiting por tipo de agente
- [ ] A/B testing de prompts

## Conclusão

O sistema de roteamento está **100% funcional** e diferencia corretamente mensagens de donos e clientes. Logs estruturados permitem análise granular e métricas separadas garantem visibilidade de custos e performance.

**Status:** ✅ PRODUCTION READY

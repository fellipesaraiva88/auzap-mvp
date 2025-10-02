# Aurora Proactive Worker

## Visão Geral

O Aurora Proactive Worker é responsável por enviar mensagens proativas automáticas para os donos de empresas, identificando oportunidades de negócio, enviando resumos diários e alertando sobre situações importantes.

## Funcionalidades

### 1. Resumo Diário (Daily Summary)
**Agendamento:** Todos os dias às 18h

**Conteúdo:**
- Total de agendamentos do dia
- Receita gerada
- Novos clientes cadastrados
- Agendamentos pendentes de confirmação
- Lista de agendamentos realizados

**Exemplo de mensagem:**
```
Olá! Aqui está o resumo do seu dia 📊

🎉 Agendamentos: 12
💰 Receita: R$ 1.450,00
👥 Novos clientes: 3
⏳ Pendentes: 2

Destaques de hoje:
- Rex - Banho e tosa às 10:00
- Luna - Consulta veterinária às 14:30
- Max - Adestramento às 16:00

Ótimo trabalho! Continue assim! 🚀
```

### 2. Clientes Inativos
**Agendamento:** Toda segunda-feira às 10h

**Critério:** Clientes sem contato há mais de 30 dias

**Conteúdo:**
- Total de clientes inativos
- Lista dos 10 principais clientes inativos
- Sugestão de campanha de reativação
- Ações recomendadas

**Exemplo de mensagem:**
```
Opa! Identifiquei 15 clientes que estão inativos há mais de 30 dias 😕

Top clientes para reconquistar:
- Maria Silva (11999998888) - Pet: Rex
- João Santos (11888887777) - Pet: Luna
- Ana Costa (11777776666) - Pet: Max

💡 Sugestão: Que tal enviar uma promoção especial?
"Sentimos sua falta! 20% de desconto no próximo banho"

Posso criar essa campanha para você?
```

### 3. Aniversários
**Agendamento:** Todos os dias às 9h

**Conteúdo:**
- Pets que fazem aniversário no dia
- Dados do tutor (nome, telefone)
- Sugestão de mensagem de felicitações
- Oportunidade de oferta especial

**Exemplo de mensagem:**
```
🎂 Temos 3 aniversariantes hoje!

- Rex (tutor: Maria Silva - 11999998888)
- Luna (tutor: João Santos - 11888887777)
- Max (tutor: Ana Costa - 11777776666)

💡 Sugestão: Envie uma mensagem carinhosa e ofereça um mimo especial! Isso fortalece o vínculo com seus clientes.

Mensagem sugerida:
"Parabéns, Rex! 🎉 Hoje é dia de festa! Ganhe 10% OFF no próximo banho."

Quer que eu envie para todos?
```

### 4. Oportunidades de Negócio
**Agendamento:** Terças e quintas às 15h

**Conteúdo:**
- Análise dos próximos 3 dias
- Horários disponíveis
- Clientes regulares que podem precisar de agendamento
- Sugestões de ações para preencher a agenda

**Exemplo de mensagem:**
```
📈 Oportunidades para os próximos 3 dias:

Agenda atual: 8 agendamentos confirmados
Horários vagos: 12 slots

💡 Clientes que podem precisar de atendimento:
- Maria Silva - último banho há 25 dias
- João Santos - costuma agendar quinzenalmente
- Ana Costa - cliente VIP, sempre agenda às terças

Ações sugeridas:
1. Enviar lembrete para Maria
2. Oferecer horário premium para João
3. Promoção relâmpago para horários da manhã

Quer que eu crie essas campanhas?
```

### 5. Alerta de Baixa Ocupação
**Acionamento:** Disparado quando amanhã tem menos de 3 agendamentos

**Conteúdo:**
- Total de agendamentos para o dia seguinte
- Lista de clientes para contatar urgentemente
- Sugestão de oferta especial
- Mensagem pronta para campanha

**Exemplo de mensagem:**
```
🚨 Alerta: Amanhã só temos 2 agendamentos!

É hora de agir rápido! 💨

Top 15 clientes para contato urgente:
- Maria Silva (cliente VIP, 20 agendamentos)
- João Santos (último contato: 10 dias atrás)
- Ana Costa (sempre agenda em cima da hora)

💡 Campanha Relâmpago Sugerida:
"⚡ HOJE SÓ! Agende para amanhã e ganhe 25% OFF
Horários disponíveis: 10h, 14h, 16h
Vagas limitadas!"

Envio essa campanha agora?
```

### 6. Campanha Personalizada
**Acionamento:** Manual, via API ou interface

**Parâmetros:**
- `campaignType`: Tipo de campanha
- `targetAudience`: Audiência alvo (inactive, vip, all)
- `message`: Mensagem base (opcional)

**Exemplo de uso:**
```typescript
await auroraProactiveQueue.add('custom-campaign', {
  type: 'custom_campaign',
  organizationId: 'org-123',
  ownerNumberId: 'owner-456',
  data: {
    campaignType: 'promocional',
    targetAudience: 'vip',
    message: 'Cliente VIP merece desconto especial!'
  }
});
```

## Configuração de Horários (Cron)

```typescript
// Resumo diário - 18h
'0 18 * * *'

// Aniversários - 9h
'0 9 * * *'

// Clientes inativos - Segunda 10h
'0 10 * * 1'

// Oportunidades - Terça e Quinta 15h
'0 15 * * 2,4'
```

## Estrutura de Dados

### Tabela: aurora_proactive_messages

```sql
CREATE TABLE aurora_proactive_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  owner_number_id UUID REFERENCES owner_numbers(id),
  message_type VARCHAR(50), -- daily_summary, inactive_clients, etc
  content TEXT,
  scheduled_for TIMESTAMP,
  status VARCHAR(20), -- pending, sent, failed
  sent_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API para Disparar Manualmente

```typescript
// Endpoint: POST /api/aurora/proactive
{
  "type": "daily_summary" | "inactive_clients" | "birthdays" | "opportunities" | "low_occupancy" | "custom_campaign",
  "data": {
    // Dados específicos do tipo de mensagem
  }
}
```

## Exemplo de Uso

### 1. Inicialização Automática
O worker é inicializado automaticamente ao rodar:
```bash
npm run worker
```

### 2. Adicionar Job Manualmente
```typescript
import { auroraProactiveQueue } from './workers/aurora-proactive';

// Adicionar resumo diário
await auroraProactiveQueue.add('daily-summary', {
  type: 'daily_summary',
  organizationId: 'org-123',
  ownerNumberId: 'owner-456'
});

// Adicionar campanha personalizada
await auroraProactiveQueue.add('custom-campaign', {
  type: 'custom_campaign',
  organizationId: 'org-123',
  ownerNumberId: 'owner-456',
  data: {
    campaignType: 'reativacao',
    targetAudience: 'inactive',
    message: 'Sentimos sua falta!'
  }
});
```

### 3. Monitorar Fila
```typescript
// Ver jobs pendentes
const jobs = await auroraProactiveQueue.getJobs(['waiting', 'active']);

// Ver jobs completados
const completed = await auroraProactiveQueue.getCompleted();

// Ver jobs com falha
const failed = await auroraProactiveQueue.getFailed();
```

## Logs

O worker emite logs estruturados para cada operação:

```typescript
// Log de sucesso
logger.info({ jobId, type, organizationId }, 'Proactive message processed successfully');

// Log de erro
logger.error({ error, jobId, type }, 'Error processing proactive message');
```

## Tratamento de Erros

1. **Instância WhatsApp desconectada:** Marca mensagem como "failed" e registra erro
2. **Número do dono não encontrado:** Pula envio e registra warning
3. **Erro na Aurora Service:** Tenta novamente com backoff exponencial
4. **Erro no Supabase:** Registra erro mas não falha o job

## Escalabilidade

- **Concurrency:** 3 jobs simultâneos
- **Retry:** 3 tentativas com backoff exponencial
- **Rate Limiting:** Respeita limites do WhatsApp (20 msg/min)
- **Queue Cleanup:** Remove jobs completados após 200 execuções

## Monitoramento Recomendado

1. **Metrics:**
   - Total de mensagens enviadas por dia
   - Taxa de sucesso/falha
   - Tempo médio de processamento

2. **Alerts:**
   - Taxa de falha > 10%
   - Fila com mais de 100 jobs pendentes
   - Nenhuma mensagem enviada em 24h

3. **Dashboard:**
   - Mensagens por tipo
   - Organizações mais ativas
   - Horários de maior volume

## Próximos Passos

1. Adicionar templates de mensagem personalizáveis
2. Implementar A/B testing de mensagens
3. Analytics de engajamento (taxa de resposta)
4. Integração com calendário para sugestões mais precisas
5. Machine Learning para prever melhor momento de envio

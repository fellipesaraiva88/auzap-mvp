# Quick Start - Sistema de Roteamento

⚡ Guia rápido para usar o sistema de roteamento Aurora vs Client-AI

---

## 🚀 Comandos Principais

```bash
cd backend

# Testar roteamento
npm run test:routing

# Ver métricas
npm run routing:status

# Demo visual
npm run routing:demo
```

---

## 📋 Como Funciona (Resumo)

### Dono envia mensagem

```
WhatsApp (55119999999)
    ↓
[AURORA] 👔
    ↓
Analytics, Automações, Relatórios
```

### Cliente envia mensagem

```
WhatsApp (55118888888)
    ↓
[CLIENT-AI] 🐾
    ↓
Atendimento, Agendamentos, Cadastros
```

---

## 🔧 Cadastrar Número de Dono

### Via Supabase SQL Editor:

```sql
INSERT INTO authorized_owner_numbers (
  organization_id,
  user_id,
  phone_number,
  is_active,
  permissions
) VALUES (
  'sua-org-uuid',
  'seu-user-uuid',
  '5511999999999',  -- Número com DDD
  true,
  '["read","write","admin"]'::jsonb
);
```

---

## 📊 Ver Métricas

### Total de mensagens por tipo:

```sql
SELECT
  agent_type,
  COUNT(*) as total
FROM ai_interactions
WHERE created_at >= CURRENT_DATE
GROUP BY agent_type;
```

### Custos do dia:

```sql
SELECT
  agent_type,
  SUM(total_tokens) as tokens,
  CASE
    WHEN agent_type = 'aurora' THEN SUM(total_tokens) * 0.00001
    ELSE SUM(total_tokens) * 0.000005
  END as cost_usd
FROM ai_interactions
WHERE created_at >= CURRENT_DATE
GROUP BY agent_type;
```

---

## 🐛 Troubleshooting

### Dono não detectado?

```sql
-- Verificar se existe
SELECT * FROM authorized_owner_numbers
WHERE phone_number = '5511999999999';

-- Ativar se necessário
UPDATE authorized_owner_numbers
SET is_active = true
WHERE phone_number = '5511999999999';
```

### Cliente sendo tratado como dono?

```sql
-- Remover entrada incorreta
DELETE FROM authorized_owner_numbers
WHERE phone_number = '5511888888888';
```

### Logs não aparecem?

```bash
# Verificar logs do backend
cd backend
npm run dev

# Buscar tags específicas
grep "[AURORA]" logs/app.log
grep "[CLIENT-AI]" logs/app.log
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `backend/src/workers/message-processor.ts` | Roteamento principal |
| `backend/src/services/aurora.service.ts` | Handler de donos |
| `backend/src/services/client-ai.service.ts` | Handler de clientes |
| `backend/src/middleware/aurora-auth.middleware.ts` | Detecção |

---

## 📖 Documentação Completa

- **Técnica:** `ROUTING-DOCS.md`
- **Executivo:** `ROUTING-SUMMARY.md`
- **Relatório:** `DIA-8-ROUTING-REPORT.md`
- **Este arquivo:** `QUICK-START-ROUTING.md`

---

## ✅ Checklist Rápido

Antes de ir para produção:

- [ ] Cadastrar números de donos no Supabase
- [ ] Executar `npm run test:routing` - todos passam?
- [ ] Executar `npm run routing:status` - métricas ok?
- [ ] Testar com mensagens reais no staging
- [ ] Monitorar logs por 1 hora
- [ ] Verificar custos no painel OpenAI

---

## 💰 Custos Esperados

**Exemplo realista (1 dono + 100 clientes):**

| Tipo | Msgs/mês | Custo/msg | Total |
|------|----------|-----------|-------|
| Aurora | 50 | $0.015 | $0.75 |
| Client-AI | 500 | $0.004 | $2.00 |
| **TOTAL** | 550 | - | **$2.75** |

---

## 🎯 Próximo Passo

Execute agora:

```bash
cd backend
npm run routing:demo
```

Depois:

```bash
npm run test:routing
npm run routing:status
```

---

**Status:** ✅ OPERACIONAL
**Última atualização:** 2025-10-02

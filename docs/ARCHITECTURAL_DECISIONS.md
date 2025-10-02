# 🏛️ Decisões Arquiteturais - AuZap Database

**Projeto:** AuZap - WhatsApp Automation SaaS
**Última Atualização:** 2025-10-02
**Status:** Production Ready ✅

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Decisão 1: UUIDs vs ULIDs](#decisão-1-uuids-vs-ulids)
3. [Decisão 2: Soft Delete Strategy](#decisão-2-soft-delete-strategy)
4. [Decisão 3: Audit Trail Automático](#decisão-3-audit-trail-automático)
5. [Decisão 4: RLS Zero-Trust](#decisão-4-rls-zero-trust)
6. [Decisão 5: Backup & Recovery](#decisão-5-backup--recovery)
7. [Consequências e Trade-offs](#consequências-e-trade-offs)
8. [Métricas de Sucesso](#métricas-de-sucesso)

---

## Visão Geral

Este documento registra as **decisões arquiteturais críticas** tomadas para o database do AuZap, incluindo justificativas, trade-offs e consequências de 2ª ordem.

### Princípios Fundamentais

1. **Zero Trust Security**: RLS em todas as tabelas, sem exceções
2. **Data Integrity**: Audit trail completo para compliance
3. **Multi-tenant Isolation**: Isolamento perfeito entre organizações
4. **GDPR/LGPD Compliance**: Soft delete com purge automático
5. **Performance First**: Indexes estratégicos para queries < 50ms

---

## Decisão 1: UUIDs vs ULIDs

### Contexto

Precisamos escolher o tipo de identificador para todas as tabelas principais. As opções eram:
- UUID v4 (random)
- ULID (Universally Unique Lexicographically Sortable Identifier)

### Decisão: **UUID v4 (gen_random_uuid)**

### Justificativa

| Critério | UUID v4 | ULID | Vencedor |
|----------|---------|------|----------|
| **Performance** | Nativo PostgreSQL | Requer extension | ✅ UUID |
| **Suporte Supabase** | 100% nativo | Requer custom function | ✅ UUID |
| **Ordenação** | ❌ Random | ✅ Cronológico | ULID |
| **Segurança** | ✅ Não revela ordem | ⚠️ Revela timestamp | ✅ UUID |
| **Simplicidade** | ✅ Zero config | ❌ Setup extra | ✅ UUID |
| **Debugging** | ⚠️ Difícil comparar | ✅ Fácil comparar | ULID |

### Implementação

```sql
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ...
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Consequências

**✅ Positivas:**
- Performance máxima (função nativa)
- Sem dependências externas
- Suportado 100% pelo Supabase
- Não revela ordem de criação (segurança)

**⚠️ Negativas:**
- Ordenação não cronológica (mitigado com `created_at`)
- Debug visual mais difícil (mitigado com logging)
- Index fragmentation levemente maior (mitigado com FILLFACTOR)

**🔄 Consequências de 2ª Ordem:**
- Queries devem sempre usar `ORDER BY created_at` quando precisar ordem cronológica
- Logs devem sempre incluir `created_at` para debugging
- Não podemos assumir que ID maior = registro mais novo

### Revisão Futura

Reavaliar se/quando:
- Supabase adicionar suporte nativo a ULID
- Performance de ordenação se tornar gargalo
- Debugging se tornar crítico

---

## Decisão 2: Soft Delete Strategy

### Contexto

Precisamos definir estratégia de deleção para dados sensíveis (LGPD/GDPR) vs. performance.

### Decisão: **Soft Delete em tabelas críticas + Hard Delete em temporárias**

### Implementação

**Tabelas com Soft Delete:**
- ✅ `contacts` - Histórico de clientes crítico
- ✅ `pets` - Dados médicos importantes
- ✅ `bookings` - Auditoria financeira
- ✅ `conversations` - Compliance/legal
- ✅ `messages` - Rastreabilidade

**Tabelas com Hard Delete:**
- ❌ `whatsapp_instances` - Sessions temporárias
- ❌ `aurora_proactive_messages` - Mensagens efêmeras
- ❌ `scheduled_followups` - Após envio

### Schema

```sql
ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_contacts_not_deleted
ON contacts(organization_id, deleted_at)
WHERE deleted_at IS NULL;
```

### Justificativa

| Critério | Hard Delete | Soft Delete | Decisão |
|----------|-------------|-------------|---------|
| **GDPR Compliance** | ❌ Perda permanente | ✅ Recuperável | Soft Delete |
| **Acidental Delete Recovery** | ❌ Impossível | ✅ Fácil | Soft Delete |
| **Performance SELECT** | ✅ Melhor | ⚠️ Filtrar deleted_at | Mitiga com INDEX |
| **Storage Cost** | ✅ Menor | ⚠️ Maior | Aceito (purge 90d) |
| **Auditoria** | ❌ Sem histórico | ✅ Completo | Soft Delete |

### Consequências

**✅ Positivas:**
- Recuperação de deletes acidentais
- Compliance LGPD/GDPR (direito ao esquecimento com delay)
- Audit trail completo
- Possibilidade de "undelete" no dashboard

**⚠️ Negativas:**
- Storage adicional (+15-20%)
- Todas queries devem filtrar `deleted_at IS NULL`
- Risco de vazamento se esquecer filtro

**🔄 Consequências de 2ª Ordem:**
- Backend deve **sempre** usar views `active_*` ou filtrar `deleted_at IS NULL`
- Criar cron job para purge automático após 90 dias
- Dashboard precisa tela "Lixeira" para restore
- Analytics deve considerar registros deletados

### Estratégia de Purge

```sql
-- Executar mensalmente via cron
SELECT public.purge_old_deleted_records(90);
```

---

## Decisão 3: Audit Trail Automático

### Contexto

Necessidade de rastreabilidade completa para debugging, compliance e segurança.

### Decisão: **Tabela `audit_logs` + Triggers automáticos**

### Implementação

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  organization_id UUID,
  action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER audit_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### Tabelas Auditadas

1. ✅ contacts
2. ✅ pets
3. ✅ bookings
4. ✅ conversations
5. ✅ messages
6. ✅ organization_settings
7. ✅ services

### Justificativa

| Critério | Sem Audit | Application-level | Database Triggers | Decisão |
|----------|-----------|-------------------|-------------------|---------|
| **Cobertura** | ❌ Zero | ⚠️ Depende dev | ✅ 100% | Triggers |
| **Reliability** | ❌ N/A | ⚠️ Bugs possíveis | ✅ Garantido | Triggers |
| **Performance** | ✅ Melhor | ⚠️ Network | ⚠️ Write overhead | Aceito |
| **Debugging** | ❌ Impossível | ⚠️ Parcial | ✅ Completo | Triggers |
| **Compliance** | ❌ Não atende | ⚠️ Risco | ✅ Atende | Triggers |

### Consequências

**✅ Positivas:**
- Rastreabilidade 100% confiável
- Debugging facilitado (ver histórico de mudanças)
- Compliance automático (quem, o quê, quando)
- Possibilidade de "time travel" queries
- Detectar bugs de concorrência

**⚠️ Negativas:**
- Storage adicional (~20% overhead)
- Write performance levemente reduzido (~5-10ms)
- JSONB pode ser grande (full row dump)

**🔄 Consequências de 2ª Ordem:**
- Dashboard pode mostrar histórico de alterações
- Criar indexes em `audit_logs` para queries rápidas
- Considerar partition por mês após 1 ano
- Possibilidade de rollback automático de mudanças

### Queries Úteis

```sql
-- Ver histórico de um contato
SELECT * FROM audit_logs
WHERE table_name = 'contacts'
  AND record_id = 'uuid-aqui'
ORDER BY changed_at DESC;

-- Ver quem mais alterou dados hoje
SELECT changed_by, COUNT(*)
FROM audit_logs
WHERE changed_at > CURRENT_DATE
GROUP BY changed_by;
```

---

## Decisão 4: RLS Zero-Trust

### Contexto

Sistema multi-tenant precisa de isolamento perfeito entre organizações.

### Decisão: **RLS com WITH CHECK em todas policies**

### Implementação

```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts: Can manage own organization"
ON contacts FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);
```

### Princípios

1. **Zero Trust**: Nenhuma tabela sem RLS
2. **WITH CHECK**: Sempre validar INSERT/UPDATE
3. **NOT NULL Check**: Sempre validar organization_id
4. **Service Role Exception**: Apenas para background jobs

### Consequências

**✅ Positivas:**
- Isolamento garantido a nível de database
- Impossível acesso cross-tenant (mesmo com bug no backend)
- Compliance automático (LGPD data isolation)
- Testes de segurança simplificados

**⚠️ Negativas:**
- Performance: Subquery em cada acesso (~2-5ms)
- Complexidade: Mais difícil debugar
- Service role precisa bypass (risco se comprometido)

**🔄 Consequências de 2ª Ordem:**
- Backend pode ser mais simples (RLS garante segurança)
- Testes devem sempre mockar auth.uid()
- Migrations devem considerar RLS
- Monitorar performance de policies

### Teste de Validação

```sql
-- Simular usuário org A
SET LOCAL request.jwt.claims = '{"sub": "user-org-a"}'::json;

-- Tentar inserir em org B (DEVE FALHAR)
INSERT INTO contacts (organization_id, phone_number)
VALUES ('org-b-uuid', '5511999999999');
-- ERROR: new row violates row-level security policy
```

---

## Decisão 5: Backup & Recovery

### Contexto

Estratégia de backup para disaster recovery e compliance.

### Decisão: **Supabase Automated Backups + Manual Exports**

### Estratégia

**Automático (Supabase):**
- ✅ Daily backups (7 days retention)
- ✅ Point-in-time recovery (PITR)
- ✅ Automated via Supabase

**Manual (Compliance):**
- ✅ Weekly full export (via `pg_dump`)
- ✅ Stored in S3 (encrypted)
- ✅ 90 days retention

### RTO/RPO

- **RTO (Recovery Time Objective):** < 15 minutos
- **RPO (Recovery Point Objective):** < 1 hora (database) / < 24h (sessions)

### Implementação

```bash
# Weekly backup script
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
aws s3 cp backup_*.sql.gz s3://auzap-backups/
```

### Consequências

**✅ Positivas:**
- Proteção contra delete acidental
- Compliance (retenção de dados)
- Disaster recovery garantido
- Auditável (histórico de backups)

**⚠️ Negativas:**
- Custo storage adicional (S3)
- Processo manual semanal
- Restore pode ser lento (> 1h para database grande)

---

## Consequências e Trade-offs

### Storage Overhead

| Decisão | Overhead | Mitigação |
|---------|----------|-----------|
| Soft Delete | +15-20% | Purge após 90 dias |
| Audit Trail | +20-25% | Partition por mês |
| Backups | +100% (externa) | S3 Glacier após 30d |
| **Total** | **+35-45%** | Monitorar mensal |

### Performance Impact

| Decisão | Impact | Mitigação |
|---------|--------|-----------|
| RLS Policies | +2-5ms por query | Indexes otimizados |
| Audit Triggers | +5-10ms por write | Aceito (crítico) |
| Soft Delete Filter | +1-2ms por query | Index WHERE deleted_at IS NULL |
| **Total** | **+8-17ms** | Aceito (< 50ms target) |

### Custo Mensal Estimado

- **Supabase Free:** $0 (até 500MB)
- **Supabase Pro:** $25/mês (> 500MB, com backups)
- **S3 Storage:** ~$5/mês (backups externos)
- **Total:** ~$30/mês (escala conforme uso)

---

## Métricas de Sucesso

### Segurança
- ✅ **Zero vazamentos cross-tenant** (target: 100%)
- ✅ **RLS coverage** (target: 100%)
- ✅ **Audit coverage** (target: 100% tabelas críticas)

### Performance
- ✅ **Query time p95** (target: < 50ms)
- ✅ **Write overhead** (target: < 20ms)
- ✅ **Index hit rate** (target: > 99%)

### Compliance
- ✅ **GDPR/LGPD ready** (soft delete + audit)
- ✅ **Backup success rate** (target: 100%)
- ✅ **RTO** (target: < 15min)

### Operacional
- ✅ **Storage growth** (monitor: < 50% overhead)
- ✅ **Purge automation** (execute: monthly)
- ✅ **Monitoring alerts** (setup: Supabase + Sentry)

---

## Revisão e Evolução

Este documento deve ser revisado:

1. **Trimestralmente**: Validar decisões com dados reais
2. **Ao escalar**: 1000+ orgs, 100k+ contatos
3. **Novos requisitos**: Compliance, features, bugs críticos
4. **Performance issues**: Queries > 100ms, storage > 80%

**Última revisão:** 2025-10-02
**Próxima revisão:** 2026-01-02 (3 meses)

---

**Desenvolvido por:** Fellipe Saraiva + Claude Code
**Status:** ✅ Production Ready

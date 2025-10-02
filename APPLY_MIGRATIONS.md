# 🚀 Como Aplicar as Migrations de Performance

## ⚠️ IMPORTANTE
As migrations precisam ser aplicadas manualmente no Supabase SQL Editor devido a restrições de permissão.

## 📋 Passo a Passo

### 1. Acessar Supabase SQL Editor
URL: https://supabase.com/dashboard/project/wsjykmcgmxugegqkwhue/sql/new

### 2. Aplicar Índices B-tree (Primeira Migration)

**Copie e cole o conteúdo abaixo no SQL Editor:**

```sql
-- Performance optimization: Add B-tree indexes on foreign keys
-- Based on Context7 best practices from /supabase/supabase
-- Migration: add_performance_indexes
-- Date: 2025-10-02

-- Messages table
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS messages_organization_id_idx ON messages USING btree (organization_id);

-- Conversations table
CREATE INDEX IF NOT EXISTS conversations_contact_id_idx ON conversations USING btree (contact_id);
CREATE INDEX IF NOT EXISTS conversations_organization_id_idx ON conversations USING btree (organization_id);
CREATE INDEX IF NOT EXISTS conversations_whatsapp_instance_id_idx ON conversations USING btree (whatsapp_instance_id);

-- Contacts table
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON contacts USING btree (phone);
CREATE INDEX IF NOT EXISTS contacts_organization_id_idx ON contacts USING btree (organization_id);

-- AI Interactions table
CREATE INDEX IF NOT EXISTS ai_interactions_organization_id_idx ON ai_interactions USING btree (organization_id);
CREATE INDEX IF NOT EXISTS ai_interactions_conversation_id_idx ON ai_interactions USING btree (conversation_id);

-- WhatsApp Instances table
CREATE INDEX IF NOT EXISTS whatsapp_instances_organization_id_idx ON whatsapp_instances USING btree (organization_id);

-- Aurora proactive messages
CREATE INDEX IF NOT EXISTS aurora_proactive_messages_organization_id_idx ON aurora_proactive_messages USING btree (organization_id);
CREATE INDEX IF NOT EXISTS aurora_proactive_messages_owner_number_id_idx ON aurora_proactive_messages USING btree (owner_number_id);

-- Owner numbers
CREATE INDEX IF NOT EXISTS owner_numbers_organization_id_idx ON owner_numbers USING btree (organization_id);

-- Verify indexes were created
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
```

**Clique em RUN** ▶️

---

### 3. Aplicar RLS Policies Otimizadas (Segunda Migration)

**Copie e cole o conteúdo abaixo no SQL Editor:**

```sql
-- Performance optimization: Optimize RLS policies with SELECT wrapping
-- Based on Context7 best practices from /supabase/supabase
-- Migration: optimize_rls_policies
-- Date: 2025-10-02

-- ============================================
-- MESSAGES TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

CREATE POLICY "messages_select_policy" ON messages
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "messages_delete_policy" ON messages
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

-- ============================================
-- CONVERSATIONS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;

CREATE POLICY "conversations_select_policy" ON conversations
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "conversations_insert_policy" ON conversations
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "conversations_update_policy" ON conversations
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "conversations_delete_policy" ON conversations
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

-- ============================================
-- CONTACTS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "contacts_select_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_update_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_policy" ON contacts;

CREATE POLICY "contacts_select_policy" ON contacts
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "contacts_insert_policy" ON contacts
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "contacts_update_policy" ON contacts
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "contacts_delete_policy" ON contacts
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

-- ============================================
-- AI INTERACTIONS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "ai_interactions_select_policy" ON ai_interactions;
DROP POLICY IF EXISTS "ai_interactions_insert_policy" ON ai_interactions;
DROP POLICY IF EXISTS "ai_interactions_update_policy" ON ai_interactions;
DROP POLICY IF EXISTS "ai_interactions_delete_policy" ON ai_interactions;

CREATE POLICY "ai_interactions_select_policy" ON ai_interactions
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "ai_interactions_insert_policy" ON ai_interactions
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "ai_interactions_update_policy" ON ai_interactions
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);

CREATE POLICY "ai_interactions_delete_policy" ON ai_interactions
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE id = (SELECT auth.uid())
  )
);
```

**Clique em RUN** ▶️

---

### 4. Verificar Índices Criados

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
```

Você deve ver todos os índices listados acima.

---

### 5. Testar Performance

```sql
-- Testar query COM índice
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE conversation_id = '267449fb-132d-43ec-8402-837e17211685';

-- Testar policy otimizada
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE organization_id IN (
  SELECT organization_id FROM users WHERE id = auth.uid()
);
```

Procure por:
- ✅ "Index Scan using messages_conversation_id_idx" (bom!)
- ❌ "Seq Scan" (ruim - índice não usado)

---

## 📊 Resultados Esperados

Após aplicar as migrations:

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Query Time (indexed)** | ~100ms | ~30ms | **-70%** |
| **RLS Evaluation** | ~50ms | ~25ms | **-50%** |
| **API Response** | 200KB | 140KB | **-30%** |

---

## ✅ Checklist

- [ ] Migration 1 aplicada (índices)
- [ ] Migration 2 aplicada (RLS policies)
- [ ] Índices verificados
- [ ] Performance testada
- [ ] Redeploy do backend (Render pegará Dockerfile otimizado automaticamente)

---

## 🔗 Links Úteis

- **Supabase SQL Editor**: https://supabase.com/dashboard/project/wsjykmcgmxugegqkwhue/sql/new
- **Render Backend**: https://dashboard.render.com/web/srv-ctohbijqf0us73bf4nlg
- **Notion Docs**: https://www.notion.so/AuZap-Arquitetura-Completa-v2-ce3243c5419c40438d52782cdb7f9b95

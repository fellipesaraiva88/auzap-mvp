-- =====================================================
-- FIX RLS SECURITY VULNERABILITIES 
-- CRITICAL: Execute este script IMEDIATAMENTE
-- =====================================================
-- Author: Security Audit
-- Date: 2025-01-02
-- Impact: CRÍTICO - Falha de isolamento multi-tenant
-- =====================================================

-- IMPORTANTE: Este script corrige vulnerabilidades críticas de segurança
-- que permitem que usuários insiram dados em organizações que não pertencem a eles

BEGIN;

-- =====================================================
-- 1. CONTACTS - Corrigir política ALL
-- =====================================================
DROP POLICY IF EXISTS "Users can manage contacts from their organization" ON contacts;

CREATE POLICY "Users can manage contacts from their organization" ON contacts
FOR ALL
USING (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
)
WITH CHECK (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
);

-- =====================================================
-- 2. MESSAGES - Corrigir política ALL
-- =====================================================
DROP POLICY IF EXISTS "Users can view messages from their organization" ON messages;

CREATE POLICY "Users can manage messages from their organization" ON messages
FOR ALL
USING (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
)
WITH CHECK (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
);

-- =====================================================
-- 3. BOOKINGS - Corrigir política ALL
-- =====================================================
DROP POLICY IF EXISTS "Users can manage bookings from their organization" ON bookings;

CREATE POLICY "Users can manage bookings from their organization" ON bookings
FOR ALL
USING (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
)
WITH CHECK (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
);

-- =====================================================
-- 4. WHATSAPP_INSTANCES - Corrigir política ALL
-- =====================================================
DROP POLICY IF EXISTS "Users can manage WhatsApp instances from their organization" ON whatsapp_instances;

CREATE POLICY "Users can manage WhatsApp instances from their organization" ON whatsapp_instances
FOR ALL
USING (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
)
WITH CHECK (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
);

-- =====================================================
-- 5. CONVERSATIONS - Corrigir política ALL
-- =====================================================
DROP POLICY IF EXISTS "Users can manage conversations from their organization" ON conversations;

CREATE POLICY "Users can manage conversations from their organization" ON conversations
FOR ALL
USING (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
)
WITH CHECK (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
);

-- =====================================================
-- 6. PETS - Corrigir política ALL
-- =====================================================
DROP POLICY IF EXISTS "Users can manage pets from their organization" ON pets;

CREATE POLICY "Users can manage pets from their organization" ON pets
FOR ALL
USING (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
)
WITH CHECK (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
);

-- =====================================================
-- 7. AI_INTERACTIONS - Adicionar política INSERT/UPDATE com CHECK
-- =====================================================
DROP POLICY IF EXISTS "Users can view their org AI interactions" ON ai_interactions;

-- Política SELECT separada
CREATE POLICY "Users can view their org AI interactions" ON ai_interactions
FOR SELECT
USING (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
    )
);

-- Nova política INSERT com validação
CREATE POLICY "Users can insert AI interactions in their org" ON ai_interactions
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT u.organization_id
        FROM users u
        WHERE u.auth_user_id = auth.uid()
        LIMIT 1
    )
);

-- =====================================================
-- 8. CRIAR FUNÇÃO HELPER PARA PERFORMANCE
-- =====================================================
-- Esta função melhora a performance e simplifica as políticas
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT organization_id
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
$$;

-- =====================================================
-- 9. ADICIONAR ÍNDICES PARA PERFORMANCE RLS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Para cada tabela com organization_id
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_organization_id ON whatsapp_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_pets_organization_id ON pets(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_organization_id ON ai_interactions(organization_id);

-- =====================================================
-- 10. VERIFICAÇÃO FINAL
-- =====================================================
-- Execute esta query após aplicar as correções para verificar
/*
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN with_check IS NOT NULL THEN '✅ WITH_CHECK OK'
        ELSE '❌ NO WITH_CHECK'
    END as check_status
FROM pg_policies
WHERE schemaname = 'public'
AND cmd = 'ALL'
AND tablename IN ('contacts', 'messages', 'bookings', 'whatsapp_instances', 
                  'conversations', 'pets', 'ai_interactions')
ORDER BY tablename;
*/

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Após executar, TESTE o isolamento tentando inserir dados com organization_id diferente
-- 2. Monitore os logs por tentativas de violação
-- 3. Considere adicionar trigger para log de auditoria
-- 4. Revise regularmente as políticas RLS
-- 5. NUNCA remova WITH CHECK de políticas ALL/INSERT/UPDATE
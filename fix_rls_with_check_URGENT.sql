-- ============================================
-- MIGRATION URGENTE: Fix RLS WITH CHECK
-- ============================================
-- Projeto: AuZap (cdndnwglcieylfgzbwts)
-- Severidade: CRÍTICA 🔴
-- Data: 2025-10-02
-- Auditor: Database Admin Security Specialist
--
-- PROBLEMA IDENTIFICADO:
-- 23 policies com comando ALL/UPDATE sem cláusula WITH CHECK,
-- permitindo inserção/atualização de dados em organizações não autorizadas.
--
-- EXECUTAR IMEDIATAMENTE EM PRODUÇÃO!
-- ============================================

BEGIN;

-- ============================================
-- HELPER FUNCTION (Criar primeiro)
-- ============================================

-- Criar função helper para otimizar queries RLS
CREATE OR REPLACE FUNCTION auth.organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT organization_id
    FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
$$;

COMMENT ON FUNCTION auth.organization_id() IS 'Returns the organization_id of the authenticated user. Used by RLS policies.';

-- ============================================
-- POLICIES CORRECTIONS - ADD WITH CHECK
-- ============================================

-- ============================================
-- 1. ai_interactions
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to AI interactions" ON ai_interactions;
CREATE POLICY "Service role has full access to AI interactions" ON ai_interactions
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- 2. aurora_automations
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to Aurora automations" ON aurora_automations;
CREATE POLICY "Service role has full access to Aurora automations" ON aurora_automations
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- 3. aurora_proactive_messages
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to Aurora messages" ON aurora_proactive_messages;
CREATE POLICY "Service role has full access to Aurora messages" ON aurora_proactive_messages
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- 4. authorized_owner_numbers
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to authorized numbers" ON authorized_owner_numbers;
CREATE POLICY "Service role has full access to authorized numbers" ON authorized_owner_numbers
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- 5. bookings
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to bookings" ON bookings;
CREATE POLICY "Service role has full access to bookings" ON bookings
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can manage bookings from their organization" ON bookings;
CREATE POLICY "Users can manage bookings from their organization" ON bookings
FOR ALL
USING (organization_id = auth.organization_id())
WITH CHECK (organization_id = auth.organization_id());

-- ============================================
-- 6. contacts
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to contacts" ON contacts;
CREATE POLICY "Service role has full access to contacts" ON contacts
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can manage contacts from their organization" ON contacts;
CREATE POLICY "Users can manage contacts from their organization" ON contacts
FOR ALL
USING (organization_id = auth.organization_id())
WITH CHECK (organization_id = auth.organization_id());

-- ============================================
-- 7. conversations
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to conversations" ON conversations;
CREATE POLICY "Service role has full access to conversations" ON conversations
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can manage conversations from their organization" ON conversations;
CREATE POLICY "Users can manage conversations from their organization" ON conversations
FOR ALL
USING (organization_id = auth.organization_id())
WITH CHECK (organization_id = auth.organization_id());

-- ============================================
-- 8. messages
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to messages" ON messages;
CREATE POLICY "Service role has full access to messages" ON messages
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can view messages from their organization" ON messages;
CREATE POLICY "Users can view messages from their organization" ON messages
FOR ALL
USING (organization_id = auth.organization_id())
WITH CHECK (organization_id = auth.organization_id());

-- ============================================
-- 9. organization_settings
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to org settings" ON organization_settings;
CREATE POLICY "Service role has full access to org settings" ON organization_settings
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- 10. organizations
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to organizations" ON organizations;
CREATE POLICY "Service role has full access to organizations" ON organizations
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- 11. pets
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to pets" ON pets;
CREATE POLICY "Service role has full access to pets" ON pets
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can manage pets from their organization" ON pets;
CREATE POLICY "Users can manage pets from their organization" ON pets
FOR ALL
USING (organization_id = auth.organization_id())
WITH CHECK (organization_id = auth.organization_id());

-- ============================================
-- 12. scheduled_followups
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to followups" ON scheduled_followups;
CREATE POLICY "Service role has full access to followups" ON scheduled_followups
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- 13. services
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to services" ON services;
CREATE POLICY "Service role has full access to services" ON services
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can manage services from their organization" ON services;
CREATE POLICY "Users can manage services from their organization" ON services
FOR ALL
USING (organization_id = auth.organization_id())
WITH CHECK (organization_id = auth.organization_id());

-- ============================================
-- 14. users
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to users" ON users;
CREATE POLICY "Service role has full access to users" ON users
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- ============================================
-- 15. whatsapp_instances
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to WhatsApp instances" ON whatsapp_instances;
CREATE POLICY "Service role has full access to WhatsApp instances" ON whatsapp_instances
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can manage WhatsApp instances from their organization" ON whatsapp_instances;
CREATE POLICY "Users can manage WhatsApp instances from their organization" ON whatsapp_instances
FOR ALL
USING (organization_id = auth.organization_id())
WITH CHECK (organization_id = auth.organization_id());

-- ============================================
-- INDICES FOR RLS PERFORMANCE
-- ============================================

-- Índice crítico para performance das policies
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Índices para organization_id (se não existirem)
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_pets_organization_id ON pets(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_organization_id ON whatsapp_instances(organization_id);

COMMIT;

-- ============================================
-- VALIDAÇÃO PÓS-MIGRATION
-- ============================================

-- Executar estas queries após o COMMIT para validar:

-- 1. Verificar que todas policies ALL têm WITH CHECK
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
AND cmd IN ('ALL', 'INSERT', 'UPDATE')
ORDER BY tablename, policyname;

-- Resultado esperado: TODAS as policies devem mostrar "✅ WITH_CHECK OK"

-- 2. Verificar que função helper foi criada
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth' 
AND p.proname = 'organization_id';

-- Resultado esperado: 1 linha com função auth.organization_id() retornando UUID

-- 3. Testar isolamento (CRÍTICO!)
-- Execute como usuário regular (não service_role):
-- 
-- INSERT INTO contacts (organization_id, name, phone) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Teste Isolamento', '555-0000');
--
-- Resultado esperado: ERROR: new row violates row-level security policy

-- ============================================
-- FIM DA MIGRATION
-- ============================================
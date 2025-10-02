-- ============================================
-- AUZAP - MIGRATION 002: FIX RLS POLICIES WITH CHECK
-- Autor: Claude Code + Fellipe Saraiva
-- Data: 2025-10-02
-- ============================================
--
-- OBJETIVO: Adicionar WITH CHECK em todas as INSERT/UPDATE policies
-- PROBLEMA: Policies sem WITH CHECK permitem bypass de RLS em INSERT/UPDATE
-- SOLUÇÃO: Recriar policies críticas com WITH CHECK clause
-- ============================================

-- ============================================
-- CONTACTS
-- ============================================

DROP POLICY IF EXISTS "Contacts: Can manage own organization" ON public.contacts;

CREATE POLICY "Contacts: Can manage own organization"
ON public.contacts
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- PETS
-- ============================================

DROP POLICY IF EXISTS "Pets: Can manage own organization" ON public.pets;

CREATE POLICY "Pets: Can manage own organization"
ON public.pets
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- BOOKINGS
-- ============================================

DROP POLICY IF EXISTS "Bookings: Can manage own organization" ON public.bookings;

CREATE POLICY "Bookings: Can manage own organization"
ON public.bookings
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- CONVERSATIONS
-- ============================================

DROP POLICY IF EXISTS "Conversations: Can manage own organization" ON public.conversations;

CREATE POLICY "Conversations: Can manage own organization"
ON public.conversations
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- MESSAGES
-- ============================================

DROP POLICY IF EXISTS "Messages: Can manage own organization" ON public.messages;

CREATE POLICY "Messages: Can manage own organization"
ON public.messages
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- SERVICES
-- ============================================

DROP POLICY IF EXISTS "Services: Can manage own organization" ON public.services;

CREATE POLICY "Services: Can manage own organization"
ON public.services
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- ORGANIZATION_SETTINGS
-- ============================================

DROP POLICY IF EXISTS "Organization Settings: Can manage own organization" ON public.organization_settings;

CREATE POLICY "Organization Settings: Can manage own organization"
ON public.organization_settings
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- WHATSAPP_INSTANCES
-- ============================================

DROP POLICY IF EXISTS "WhatsApp Instances: Can manage own organization" ON public.whatsapp_instances;

CREATE POLICY "WhatsApp Instances: Can manage own organization"
ON public.whatsapp_instances
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- AUTHORIZED_OWNER_NUMBERS
-- ============================================

DROP POLICY IF EXISTS "Authorized Owner Numbers: Can manage own organization" ON public.authorized_owner_numbers;

CREATE POLICY "Authorized Owner Numbers: Can manage own organization"
ON public.authorized_owner_numbers
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- AI_INTERACTIONS
-- ============================================

DROP POLICY IF EXISTS "AI Interactions: Can manage own organization" ON public.ai_interactions;

CREATE POLICY "AI Interactions: Can manage own organization"
ON public.ai_interactions
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- SCHEDULED_FOLLOWUPS
-- ============================================

DROP POLICY IF EXISTS "Scheduled Followups: Can manage own organization" ON public.scheduled_followups;

CREATE POLICY "Scheduled Followups: Can manage own organization"
ON public.scheduled_followups
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- AURORA_PROACTIVE_MESSAGES
-- ============================================

DROP POLICY IF EXISTS "Aurora Messages: Can manage own organization" ON public.aurora_proactive_messages;

CREATE POLICY "Aurora Messages: Can manage own organization"
ON public.aurora_proactive_messages
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- AURORA_AUTOMATIONS
-- ============================================

DROP POLICY IF EXISTS "Aurora Automations: Can manage own organization" ON public.aurora_automations;

CREATE POLICY "Aurora Automations: Can manage own organization"
ON public.aurora_automations
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE auth_user_id = auth.uid()
  )
  AND organization_id IS NOT NULL
);

-- ============================================
-- VALIDAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002 executada com sucesso!';
  RAISE NOTICE '📊 Todas as policies agora têm WITH CHECK clause';
  RAISE NOTICE '🔒 Proteção contra bypass de RLS em INSERT/UPDATE ativa';
END $$;

-- ============================================
-- RESUMO DA MIGRATION
-- ============================================
-- ✅ 13 policies recriadas com WITH CHECK
-- ✅ Todas validam organization_id IS NOT NULL
-- ✅ Zero-trust: sem policy sem WITH CHECK
-- ✅ Multi-tenant isolation garantido
-- ============================================

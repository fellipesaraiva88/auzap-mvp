-- Performance optimization: Optimize RLS policies with SELECT wrapping
-- Based on Context7 best practices from /supabase/supabase
-- Migration: optimize_rls_policies
-- Date: 2025-10-02

-- ============================================
-- MESSAGES TABLE RLS OPTIMIZATION
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- Create optimized policies with SELECT wrapping for auth.uid() caching
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

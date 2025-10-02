-- ============================================
-- RLS POLICIES OPTIMIZATION
-- Target: <50ms query execution with RLS enabled
-- ============================================

-- Drop existing inefficient RLS policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view org users" ON users;
DROP POLICY IF EXISTS "Users can view org settings" ON organization_settings;
DROP POLICY IF EXISTS "Users can manage instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can manage services" ON services;
DROP POLICY IF EXISTS "Users can manage owner numbers" ON authorized_owner_numbers;
DROP POLICY IF EXISTS "Users can manage contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage pets" ON pets;
DROP POLICY IF EXISTS "Users can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can manage followups" ON scheduled_followups;
DROP POLICY IF EXISTS "Users can view aurora messages" ON aurora_proactive_messages;
DROP POLICY IF EXISTS "Users can manage automations" ON aurora_automations;

-- ============================================
-- HELPER FUNCTION FOR OPTIMIZED RLS
-- ============================================

-- Create optimized function to get user's organization
-- This replaces the slow subquery in every policy
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.user_organization_id() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION auth.user_organization_id() IS
  'Optimized function to get current user organization ID. Uses STABLE for query plan caching.';

-- ============================================
-- OPTIMIZED RLS POLICIES
-- ============================================

-- Organizations: READ-ONLY (users never update their org directly)
CREATE POLICY "org_select" ON organizations
  FOR SELECT
  TO authenticated
  USING (id = auth.user_organization_id());

-- Users: Split policies by operation for better planning
CREATE POLICY "users_select" ON users
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "users_insert" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "users_update" ON users
  FOR UPDATE
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- Organization Settings
CREATE POLICY "org_settings_all" ON organization_settings
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- WhatsApp Instances
CREATE POLICY "whatsapp_select" ON whatsapp_instances
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "whatsapp_modify" ON whatsapp_instances
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- Services
CREATE POLICY "services_select" ON services
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "services_modify" ON services
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- Authorized Owner Numbers
CREATE POLICY "owner_numbers_all" ON authorized_owner_numbers
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- Contacts (High traffic - optimize heavily)
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE
  TO authenticated
  USING (organization_id = auth.user_organization_id());

-- Pets
CREATE POLICY "pets_select" ON pets
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "pets_modify" ON pets
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- Bookings (Critical path - highly optimized)
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "bookings_delete" ON bookings
  FOR DELETE
  TO authenticated
  USING (organization_id = auth.user_organization_id());

-- Conversations (High traffic)
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "conversations_modify" ON conversations
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- Messages (Highest traffic - most critical)
CREATE POLICY "messages_select" ON messages
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "messages_insert" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.user_organization_id());

-- Messages rarely updated, only status changes
CREATE POLICY "messages_update" ON messages
  FOR UPDATE
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- AI Interactions (Analytics - READ-HEAVY)
CREATE POLICY "ai_interactions_select" ON ai_interactions
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "ai_interactions_insert" ON ai_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.user_organization_id());

-- Scheduled Followups
CREATE POLICY "followups_all" ON scheduled_followups
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- Aurora Proactive Messages
CREATE POLICY "aurora_messages_select" ON aurora_proactive_messages
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "aurora_messages_insert" ON aurora_proactive_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = auth.user_organization_id());

-- Aurora Automations
CREATE POLICY "aurora_automations_all" ON aurora_automations
  FOR ALL
  TO authenticated
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());

-- ============================================
-- SERVICE ROLE BYPASS (for backend workers)
-- ============================================

-- Service role can bypass all RLS (for background jobs)
-- This is already implicit with service_role, but explicit policies help with clarity

-- ============================================
-- PERFORMANCE VALIDATION QUERY
-- ============================================

-- Run this to validate RLS performance
-- Expected: All queries < 50ms

-- Test query for contacts lookup (most common)
-- EXPLAIN ANALYZE
-- SELECT * FROM contacts
-- WHERE organization_id = auth.user_organization_id()
--   AND phone_number = '+5511999999999'
-- LIMIT 1;

-- Test query for bookings calendar (dashboard critical path)
-- EXPLAIN ANALYZE
-- SELECT * FROM bookings
-- WHERE organization_id = auth.user_organization_id()
--   AND scheduled_start >= NOW()
--   AND scheduled_start < NOW() + INTERVAL '7 days'
--   AND status IN ('pending', 'confirmed')
-- ORDER BY scheduled_start ASC;

-- Test query for messages timeline (conversation view)
-- EXPLAIN ANALYZE
-- SELECT * FROM messages
-- WHERE conversation_id = 'some-uuid'
--   AND organization_id = auth.user_organization_id()
-- ORDER BY created_at DESC
-- LIMIT 50;

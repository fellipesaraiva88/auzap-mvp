-- ============================================
-- PERFORMANCE OPTIMIZATION MIGRATION
-- Target: <200ms p95 response time, <50ms queries
-- ============================================

-- Drop existing basic indexes (will be replaced with optimized ones)
DROP INDEX IF EXISTS idx_users_organization;
DROP INDEX IF EXISTS idx_users_auth;
DROP INDEX IF EXISTS idx_contacts_organization;
DROP INDEX IF EXISTS idx_contacts_phone;
DROP INDEX IF EXISTS idx_pets_contact;
DROP INDEX IF EXISTS idx_bookings_organization;
DROP INDEX IF EXISTS idx_bookings_scheduled;
DROP INDEX IF EXISTS idx_conversations_organization;
DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_messages_created;
DROP INDEX IF EXISTS idx_aurora_messages_organization;
DROP INDEX IF EXISTS idx_aurora_messages_scheduled;

-- ============================================
-- CORE TABLES INDEXES
-- ============================================

-- Organizations: Optimize email lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_email_active
  ON organizations(email) WHERE created_at > NOW() - INTERVAL '1 year';

-- Users: Compound indexes for RLS queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_auth
  ON users(organization_id, auth_user_id)
  INCLUDE (id, role, email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_org
  ON users(auth_user_id, organization_id)
  WHERE auth_user_id IS NOT NULL;

-- Organization Settings: Fast org lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_settings_org_enabled
  ON organization_settings(organization_id)
  WHERE ai_client_enabled = true OR aurora_enabled = true;

-- WhatsApp Instances: Status + org composite
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_org_status
  ON whatsapp_instances(organization_id, status)
  INCLUDE (id, instance_name, phone_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_active
  ON whatsapp_instances(organization_id, last_connected_at DESC)
  WHERE status = 'connected';

-- Services: Active services by org
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_org_active
  ON services(organization_id, is_active)
  INCLUDE (id, name, type, price_cents);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_type_active
  ON services(organization_id, type)
  WHERE is_active = true;

-- ============================================
-- CONTACTS & PETS INDEXES
-- ============================================

-- Contacts: Phone lookup optimization (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_org_phone
  ON contacts(organization_id, phone_number)
  INCLUDE (id, full_name, email, last_interaction_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_active_interaction
  ON contacts(organization_id, last_interaction_at DESC NULLS LAST)
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_tags
  ON contacts USING GIN(tags)
  WHERE is_active = true;

-- Pets: Contact lookup with active filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_contact_active
  ON pets(contact_id, is_active)
  INCLUDE (id, name, species, breed);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_org_species
  ON pets(organization_id, species)
  WHERE is_active = true;

-- ============================================
-- BOOKINGS INDEXES (Critical for performance)
-- ============================================

-- Bookings: Time-range queries (dashboard, calendar)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_org_scheduled_status
  ON bookings(organization_id, scheduled_start DESC, status)
  INCLUDE (id, contact_id, pet_id, service_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_range
  ON bookings(organization_id, scheduled_start, scheduled_end)
  WHERE status IN ('pending', 'confirmed', 'in_progress');

-- Bookings: Contact and service lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_contact_recent
  ON bookings(contact_id, scheduled_start DESC)
  WHERE status != 'cancelled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_service_stats
  ON bookings(service_id, status, scheduled_start)
  WHERE scheduled_start > NOW() - INTERVAL '90 days';

-- Bookings: Reminder optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_reminders
  ON bookings(scheduled_start, status)
  WHERE reminder_sent_at IS NULL
    AND status IN ('pending', 'confirmed')
    AND scheduled_start > NOW();

-- ============================================
-- WHATSAPP & CONVERSATIONS INDEXES
-- ============================================

-- Conversations: Active conversations by org
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_org_status
  ON conversations(organization_id, status, last_message_at DESC NULLS LAST)
  INCLUDE (id, contact_id, whatsapp_instance_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_contact_active
  ON conversations(contact_id, last_message_at DESC)
  WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_escalated
  ON conversations(organization_id, escalated_to_human_at DESC)
  WHERE status = 'escalated';

-- Messages: Conversation timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_time
  ON messages(conversation_id, created_at DESC)
  INCLUDE (id, direction, content, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_org_recent
  ON messages(organization_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_pending
  ON messages(organization_id, status, created_at)
  WHERE status IN ('pending', 'failed');

-- AI Interactions: Analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_org_date
  ON ai_interactions(organization_id, created_at DESC)
  INCLUDE (model, total_cost_cents, intent_detected);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_conversation
  ON ai_interactions(conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;

-- ============================================
-- FOLLOWUPS & AURORA INDEXES
-- ============================================

-- Scheduled Followups: Pending jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_pending
  ON scheduled_followups(scheduled_for ASC, status)
  WHERE status = 'pending' AND scheduled_for > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_org_status
  ON scheduled_followups(organization_id, status, scheduled_for DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_booking
  ON scheduled_followups(booking_id, status)
  WHERE booking_id IS NOT NULL;

-- Aurora Proactive Messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_messages_pending
  ON aurora_proactive_messages(scheduled_for ASC, status)
  WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_messages_org_type
  ON aurora_proactive_messages(organization_id, message_type, sent_at DESC);

-- Aurora Automations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_automations_next_run
  ON aurora_automations(next_run_at ASC, is_active)
  WHERE is_active = true AND next_run_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aurora_automations_org_type
  ON aurora_automations(organization_id, automation_type, is_active);

-- ============================================
-- STATISTICS UPDATE
-- ============================================

-- Update table statistics for better query planning
ANALYZE organizations;
ANALYZE users;
ANALYZE organization_settings;
ANALYZE whatsapp_instances;
ANALYZE services;
ANALYZE contacts;
ANALYZE pets;
ANALYZE bookings;
ANALYZE conversations;
ANALYZE messages;
ANALYZE ai_interactions;
ANALYZE scheduled_followups;
ANALYZE aurora_proactive_messages;
ANALYZE aurora_automations;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_users_org_auth IS 'Optimizes RLS policy queries for user verification';
COMMENT ON INDEX idx_contacts_org_phone IS 'Critical for WhatsApp message routing by phone number';
COMMENT ON INDEX idx_bookings_org_scheduled_status IS 'Main index for dashboard calendar queries';
COMMENT ON INDEX idx_messages_conversation_time IS 'Optimizes conversation history loading';
COMMENT ON INDEX idx_followups_pending IS 'Critical for followup job processing';

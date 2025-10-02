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

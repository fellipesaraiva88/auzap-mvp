-- AuZap Complete Schema v2.0
-- 15 Tables with RLS Policies
-- Multi-tenant Architecture

-- ============================================
-- CORE TABLES (6)
-- ============================================

-- 1. Organizations (Petshops)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Staff)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization Settings (AI configs)
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_client_enabled BOOLEAN DEFAULT true,
  ai_client_model TEXT DEFAULT 'gpt-4-turbo-preview',
  ai_client_temperature DECIMAL(2,1) DEFAULT 0.7,
  aurora_enabled BOOLEAN DEFAULT true,
  aurora_model TEXT DEFAULT 'gpt-4-turbo-preview',
  aurora_daily_summary_time TIME DEFAULT '18:00:00',
  business_hours JSONB DEFAULT '{"monday": {"open": "09:00", "close": "18:00"}}',
  services_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WhatsApp Instances
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('disconnected', 'connecting', 'connected', 'qr_pending')),
  qr_code TEXT,
  session_data JSONB,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, instance_name)
);

-- 5. Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'grooming', 'hotel', 'daycare', 'surgery', 'exam', 'vaccine')),
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Authorized Owner Numbers (Aurora access)
CREATE TABLE IF NOT EXISTS authorized_owner_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, phone_number)
);

-- ============================================
-- CLIENTS & PETS (3)
-- ============================================

-- 7. Contacts (Clients/Tutors)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  last_interaction_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, phone_number)
);

-- 8. Pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
  breed TEXT,
  age_years INTEGER,
  age_months INTEGER,
  weight_kg DECIMAL(5,2),
  color TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  is_neutered BOOLEAN,
  medical_notes TEXT,
  allergies TEXT[] DEFAULT '{}',
  vaccinations JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  whatsapp_instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  cancellation_reason TEXT,
  notes TEXT,
  reminder_sent_at TIMESTAMPTZ,
  price_cents INTEGER,
  created_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WHATSAPP & AI CLIENT (4)
-- ============================================

-- 10. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'escalated', 'spam')),
  last_message_at TIMESTAMPTZ,
  escalated_to_human_at TIMESTAMPTZ,
  escalation_reason TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_by_ai BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AI Interactions (Client AI logs)
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_cost_cents INTEGER,
  intent_detected TEXT,
  entities_extracted JSONB DEFAULT '{}',
  action_taken TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Scheduled Followups
CREATE TABLE IF NOT EXISTS scheduled_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  message_template TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AURORA TABLES (2)
-- ============================================

-- 14. Aurora Proactive Messages
CREATE TABLE IF NOT EXISTS aurora_proactive_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('daily_summary', 'opportunity_alert', 'campaign_suggestion', 'goal_celebration', 'analytics_insight')),
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Aurora Automations
CREATE TABLE IF NOT EXISTS aurora_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('fill_agenda', 'reactivation_campaign', 'birthday_reminder', 'review_request', 'promotional_blast')),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_config JSONB NOT NULL,
  action_config JSONB NOT NULL,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Performance indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_auth ON users(auth_user_id);
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_pets_contact ON pets(contact_id);
CREATE INDEX idx_bookings_organization ON bookings(organization_id);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_start, scheduled_end);
CREATE INDEX idx_conversations_organization ON conversations(organization_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_aurora_messages_organization ON aurora_proactive_messages(organization_id);
CREATE INDEX idx_aurora_messages_scheduled ON aurora_proactive_messages(scheduled_for);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_owner_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE aurora_proactive_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE aurora_automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Multi-tenant isolation)
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view org users" ON users
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view org settings" ON organization_settings
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage instances" ON whatsapp_instances
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage services" ON services
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage owner numbers" ON authorized_owner_numbers
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage contacts" ON contacts
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage pets" ON pets
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage bookings" ON bookings
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view conversations" ON conversations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view messages" ON messages
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view AI interactions" ON ai_interactions
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage followups" ON scheduled_followups
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view aurora messages" ON aurora_proactive_messages
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage automations" ON aurora_automations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE auth_user_id = auth.uid()));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_followups_updated_at BEFORE UPDATE ON scheduled_followups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aurora_automations_updated_at BEFORE UPDATE ON aurora_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

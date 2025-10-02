-- ====================================
-- AUTHORIZED OWNER NUMBERS TABLE SETUP
-- ====================================
-- Execute this SQL in Supabase Dashboard SQL Editor
-- Path: Dashboard > SQL Editor > New Query

-- 1. Drop existing table if needed (for clean setup)
DROP TABLE IF EXISTS authorized_owner_numbers CASCADE;

-- 2. Create the complete table structure
CREATE TABLE authorized_owner_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  phone_number TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'admin')),

  is_active BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, phone_number)
);

-- 3. Create indexes for performance
CREATE INDEX idx_authorized_owners_org
  ON authorized_owner_numbers(organization_id);

CREATE INDEX idx_authorized_owners_phone
  ON authorized_owner_numbers(organization_id, phone_number)
  WHERE is_active = true;

-- 4. Enable Row Level Security
ALTER TABLE authorized_owner_numbers ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Policy for authenticated users to access their organization's owner numbers
CREATE POLICY "Users can view their org owner numbers"
  ON authorized_owner_numbers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy for authenticated users to manage their organization's owner numbers (admin only)
CREATE POLICY "Admins can manage their org owner numbers"
  ON authorized_owner_numbers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- 6. Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for updated_at column
CREATE TRIGGER update_authorized_owner_numbers_updated_at
  BEFORE UPDATE ON authorized_owner_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert initial test data
INSERT INTO authorized_owner_numbers (
  organization_id,
  phone_number,
  owner_name,
  role,
  is_active,
  notifications_enabled
)
VALUES
  (
    '267449fb-132d-43ec-8402-837e17211685', -- AuZap Demo organization
    '5511999887766',
    'Admin AuZap',
    'owner',
    true,
    true
  ),
  (
    '267449fb-132d-43ec-8402-837e17211685',
    '5511998877665',
    'Manager AuZap',
    'manager',
    true,
    true
  ),
  (
    '267449fb-132d-43ec-8402-837e17211685',
    '5511997766554',
    'Admin Secondary',
    'admin',
    true,
    false
  )
ON CONFLICT (organization_id, phone_number) DO UPDATE
SET
  owner_name = EXCLUDED.owner_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  notifications_enabled = EXCLUDED.notifications_enabled,
  updated_at = NOW();

-- 9. Verify table creation and data
SELECT
  id,
  organization_id,
  phone_number,
  owner_name,
  role,
  is_active,
  notifications_enabled,
  created_at,
  updated_at
FROM authorized_owner_numbers
ORDER BY created_at DESC;

-- 10. Show table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'authorized_owner_numbers'
ORDER BY ordinal_position;

-- ====================================
-- END OF SETUP
-- ====================================
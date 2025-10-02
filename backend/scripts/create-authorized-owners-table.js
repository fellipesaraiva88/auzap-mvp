const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuthorizedOwnersTable() {
  console.log('Creating authorized_owner_numbers table...');

  try {
    // Create table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing table if needed (for clean setup)
        DROP TABLE IF EXISTS authorized_owner_numbers CASCADE;

        -- Create table
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
      `
    }).single();

    if (createError) {
      console.log('Note: exec_sql might not be available, trying direct approach...');
    }

    // Create indexes
    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_authorized_owners_org
          ON authorized_owner_numbers(organization_id);

        CREATE INDEX IF NOT EXISTS idx_authorized_owners_phone
          ON authorized_owner_numbers(organization_id, phone_number)
          WHERE is_active = true;
      `
    }).single();

    // Insert test data
    console.log('Inserting test data...');
    const { data: insertData, error: insertError } = await supabase
      .from('authorized_owner_numbers')
      .upsert([
        {
          organization_id: '267449fb-132d-43ec-8402-837e17211685',
          phone_number: '5511999887766',
          owner_name: 'Admin AuZap',
          role: 'owner'
        },
        {
          organization_id: '267449fb-132d-43ec-8402-837e17211685',
          phone_number: '5511998877665',
          owner_name: 'Manager AuZap',
          role: 'manager'
        }
      ], {
        onConflict: 'organization_id,phone_number'
      });

    if (insertError) {
      console.error('Error inserting data:', insertError);
    } else {
      console.log('Test data inserted successfully');
    }

    // Verify table creation
    console.log('\nVerifying table creation...');
    const { data, error } = await supabase
      .from('authorized_owner_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      console.log('Table created successfully with data:');
      console.table(data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Alternative approach using direct SQL execution
async function createTableDirectly() {
  console.log('\nTrying direct table creation...');

  try {
    // First, let's check if table exists
    const { data: checkTable, error: checkError } = await supabase
      .from('authorized_owner_numbers')
      .select('count')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('Table does not exist, will create via dashboard or migration');

      // Since we can't execute raw SQL directly, let's output the SQL for manual execution
      console.log('\n=== SQL TO EXECUTE IN SUPABASE DASHBOARD ===\n');
      console.log(`
-- Create table authorized_owner_numbers
CREATE TABLE IF NOT EXISTS authorized_owner_numbers (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_authorized_owners_org
  ON authorized_owner_numbers(organization_id);

CREATE INDEX IF NOT EXISTS idx_authorized_owners_phone
  ON authorized_owner_numbers(organization_id, phone_number)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE authorized_owner_numbers ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can access their org owner numbers"
  ON authorized_owner_numbers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_authorized_owner_numbers_updated_at
  BEFORE UPDATE ON authorized_owner_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('\n=== END SQL ===\n');

      return false;
    } else if (checkError) {
      console.log('Error checking table:', checkError);
      return false;
    } else {
      console.log('Table already exists!');
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Starting authorized_owner_numbers table setup...');
  console.log('Supabase URL:', supabaseUrl);

  // Try direct approach first
  const tableExists = await createTableDirectly();

  if (tableExists) {
    // Insert test data
    console.log('\nInserting test data...');
    const { data, error } = await supabase
      .from('authorized_owner_numbers')
      .upsert([
        {
          organization_id: '267449fb-132d-43ec-8402-837e17211685',
          phone_number: '5511999887766',
          owner_name: 'Admin AuZap',
          role: 'owner',
          is_active: true,
          notifications_enabled: true
        },
        {
          organization_id: '267449fb-132d-43ec-8402-837e17211685',
          phone_number: '5511998877665',
          owner_name: 'Manager AuZap',
          role: 'manager',
          is_active: true,
          notifications_enabled: true
        }
      ], {
        onConflict: 'organization_id,phone_number'
      })
      .select();

    if (error) {
      console.error('Error inserting data:', error);
    } else {
      console.log('Data inserted successfully:');
      console.table(data);
    }
  }

  process.exit(0);
}

main();
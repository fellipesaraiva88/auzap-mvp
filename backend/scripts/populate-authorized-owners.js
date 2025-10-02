const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateAuthorizedOwners() {
  console.log('Populating authorized_owner_numbers table...');

  try {
    // First, check table structure
    console.log('Checking table structure...');
    const { data: checkData, error: checkError } = await supabase
      .from('authorized_owner_numbers')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('Table check error:', checkError.message);
      console.log('\nPlease execute the following SQL in Supabase Dashboard SQL Editor:');
      console.log('=====================================');
      console.log(`
-- Add missing columns if they don't exist
ALTER TABLE authorized_owner_numbers
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

ALTER TABLE authorized_owner_numbers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE authorized_owner_numbers
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- Add constraint for role
ALTER TABLE authorized_owner_numbers
DROP CONSTRAINT IF EXISTS authorized_owner_numbers_role_check;

ALTER TABLE authorized_owner_numbers
ADD CONSTRAINT authorized_owner_numbers_role_check
CHECK (role IN ('owner', 'manager', 'admin'));
      `);
      console.log('=====================================\n');
      console.log('After executing the SQL, run this script again.');
      return;
    }

    // Clear existing test data
    console.log('Clearing existing test data...');
    const { error: deleteError } = await supabase
      .from('authorized_owner_numbers')
      .delete()
      .eq('organization_id', '267449fb-132d-43ec-8402-837e17211685');

    if (deleteError) {
      console.log('Warning: Could not clear existing data:', deleteError.message);
    }

    // Insert new test data
    console.log('Inserting test data...');
    const testData = [
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
      },
      {
        organization_id: '267449fb-132d-43ec-8402-837e17211685',
        phone_number: '5511997766554',
        owner_name: 'Admin Secondary',
        role: 'admin',
        is_active: true,
        notifications_enabled: false
      }
    ];

    const { data, error } = await supabase
      .from('authorized_owner_numbers')
      .insert(testData)
      .select();

    if (error) {
      console.error('Error inserting data:', error);

      // Try inserting without the new columns
      console.log('\nTrying to insert with basic columns only...');
      const basicData = testData.map(item => ({
        organization_id: item.organization_id,
        phone_number: item.phone_number,
        owner_name: item.owner_name
      }));

      const { data: basicInsert, error: basicError } = await supabase
        .from('authorized_owner_numbers')
        .insert(basicData)
        .select();

      if (basicError) {
        console.error('Basic insert also failed:', basicError);
      } else {
        console.log('Basic data inserted successfully:');
        console.table(basicInsert);
      }
    } else {
      console.log('Data inserted successfully:');
      console.table(data);
    }

    // Verify final data
    console.log('\n=== Final Table Contents ===');
    const { data: finalData, error: finalError } = await supabase
      .from('authorized_owner_numbers')
      .select('*')
      .eq('organization_id', '267449fb-132d-43ec-8402-837e17211685')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('Error fetching final data:', finalError);
    } else {
      console.table(finalData);
      console.log(`\nTotal records: ${finalData.length}`);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
populateAuthorizedOwners().then(() => {
  console.log('\nScript completed!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
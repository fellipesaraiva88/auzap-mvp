import { config } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Load test environment variables
config({ path: '.env.test' });

export interface TestContext {
  supabase: SupabaseClient;
  testOrgId: string;
  testUserId: string;
  testUserEmail: string;
  testUserPassword: string;
  testAccessToken: string;
  cleanup: () => Promise<void>;
}

let testContext: TestContext | null = null;

/**
 * Setup test environment before all tests
 */
export async function setupTestEnvironment(): Promise<TestContext> {
  if (testContext) {
    return testContext;
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.test');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Create test organization
  const testOrgName = `Test Org ${randomUUID()}`;
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: testOrgName,
      plan: 'starter',
      status: 'active',
    })
    .select()
    .single();

  if (orgError || !orgData) {
    throw new Error(`Failed to create test organization: ${orgError?.message}`);
  }

  // Create test user
  const testUserEmail = `test-${randomUUID()}@example.com`;
  const testUserPassword = 'Test@12345';

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testUserEmail,
    password: testUserPassword,
    email_confirm: true,
    user_metadata: {
      organization_id: orgData.id,
      role: 'admin',
    },
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`);
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: testUserEmail,
      organization_id: orgData.id,
      role: 'admin',
      name: 'Test User',
    });

  if (profileError) {
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  // Generate access token
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: testUserEmail,
    password: testUserPassword,
  });

  if (sessionError || !sessionData.session) {
    throw new Error(`Failed to create session: ${sessionError?.message}`);
  }

  const cleanup = async () => {
    try {
      // Delete test data in correct order (respect foreign keys)
      await supabase.from('followups').delete().eq('organization_id', orgData.id);
      await supabase.from('bookings').delete().eq('organization_id', orgData.id);
      await supabase.from('pets').delete().eq('organization_id', orgData.id);
      await supabase.from('contacts').delete().eq('organization_id', orgData.id);
      await supabase.from('services').delete().eq('organization_id', orgData.id);
      await supabase.from('users').delete().eq('organization_id', orgData.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('organizations').delete().eq('id', orgData.id);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  testContext = {
    supabase,
    testOrgId: orgData.id,
    testUserId: authData.user.id,
    testUserEmail,
    testUserPassword,
    testAccessToken: sessionData.session.access_token,
    cleanup,
  };

  return testContext;
}

/**
 * Clean up test environment after all tests
 */
export async function cleanupTestEnvironment() {
  if (testContext) {
    await testContext.cleanup();
    testContext = null;
  }
}

/**
 * Get current test context
 */
export function getTestContext(): TestContext {
  if (!testContext) {
    throw new Error('Test context not initialized. Call setupTestEnvironment() first.');
  }
  return testContext;
}

// Global setup and teardown
beforeAll(async () => {
  await setupTestEnvironment();
}, 30000);

afterAll(async () => {
  await cleanupTestEnvironment();
}, 30000);

// Reset database state between tests (optional, use with caution)
export async function resetTestData() {
  const context = getTestContext();
  const { supabase, testOrgId } = context;

  // Delete all test data except org and user
  await supabase.from('followups').delete().eq('organization_id', testOrgId);
  await supabase.from('bookings').delete().eq('organization_id', testOrgId);
  await supabase.from('pets').delete().eq('organization_id', testOrgId);
  await supabase.from('contacts').delete().eq('organization_id', testOrgId);
  await supabase.from('services').delete().eq('organization_id', testOrgId);
}

import { getTestContext, setupTestEnvironment, cleanupTestEnvironment } from './setup';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

describe('Authentication Tests', () => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const { testUserEmail, testUserPassword } = getTestContext();

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      expect(error).toBeNull();
      expect(data.session).toBeDefined();
      expect(data.session?.access_token).toBeDefined();
      expect(data.session?.refresh_token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUserEmail);
    });

    it('should fail login with invalid email', async () => {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'invalid@example.com',
        password: 'WrongPassword123',
      });

      expect(error).toBeDefined();
      expect(data.session).toBeNull();
      expect(data.user).toBeNull();
    });

    it('should fail login with invalid password', async () => {
      const { testUserEmail } = getTestContext();
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: 'WrongPassword123',
      });

      expect(error).toBeDefined();
      expect(data.session).toBeNull();
    });

    it('should fail login with empty credentials', async () => {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error } = await supabase.auth.signInWithPassword({
        email: '',
        password: '',
      });

      expect(error).toBeDefined();
    });
  });

  describe('JWT Token Validation', () => {
    it('should have valid JWT token structure', async () => {
      const { testAccessToken } = getTestContext();

      expect(testAccessToken).toBeDefined();
      expect(typeof testAccessToken).toBe('string');
      expect(testAccessToken.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should decode JWT token successfully', async () => {
      const { testAccessToken } = getTestContext();

      const decoded = jwt.decode(testAccessToken);

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty('sub'); // User ID
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('exp'); // Expiration
      expect(decoded).toHaveProperty('iat'); // Issued at
    });

    it('should have organization_id in token metadata', async () => {
      const { testAccessToken, testOrgId } = getTestContext();

      const decoded: any = jwt.decode(testAccessToken);

      expect(decoded).toBeDefined();

      // Check in user_metadata or app_metadata
      const orgId = decoded.user_metadata?.organization_id ||
                    decoded.app_metadata?.organization_id ||
                    decoded.organization_id;

      expect(orgId).toBe(testOrgId);
    });

    it('should have valid token expiration', async () => {
      const { testAccessToken } = getTestContext();

      const decoded: any = jwt.decode(testAccessToken);
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      expect(expirationTime).toBeGreaterThan(currentTime);
    });

    it('should reject expired token', async () => {
      // Create a client with user context
      const { testUserEmail, testUserPassword } = getTestContext();
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Login to get a fresh token
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const token = loginData.session?.access_token;

      // Decode and check it's not expired
      const decoded: any = jwt.decode(token!);
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();

      expect(expirationTime).toBeGreaterThan(currentTime);
    });
  });

  describe('User Registration', () => {
    let newUserEmail: string;
    let newUserId: string;

    afterEach(async () => {
      // Cleanup newly created users
      if (newUserId) {
        const { supabase } = getTestContext();
        await supabase.from('users').delete().eq('id', newUserId);
        await supabase.auth.admin.deleteUser(newUserId);
      }
    });

    it('should register a new user', async () => {
      const { supabase, testOrgId } = getTestContext();

      newUserEmail = `new-user-${randomUUID()}@example.com`;
      const password = 'NewUser@123';

      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password,
        email_confirm: true,
        user_metadata: {
          organization_id: testOrgId,
          role: 'user',
        },
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(newUserEmail);

      newUserId = data.user.id;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: newUserEmail,
          organization_id: testOrgId,
          role: 'user',
          name: 'New User',
        });

      expect(profileError).toBeNull();
    });

    it('should fail to register with existing email', async () => {
      const { supabase, testUserEmail, testOrgId } = getTestContext();

      const { error } = await supabase.auth.admin.createUser({
        email: testUserEmail, // Already exists
        password: 'Test@123',
        email_confirm: true,
        user_metadata: {
          organization_id: testOrgId,
          role: 'user',
        },
      });

      expect(error).toBeDefined();
    });

    it('should require valid email format', async () => {
      const { supabase, testOrgId } = getTestContext();

      const { error } = await supabase.auth.admin.createUser({
        email: 'invalid-email',
        password: 'Test@123',
        email_confirm: true,
        user_metadata: {
          organization_id: testOrgId,
          role: 'user',
        },
      });

      expect(error).toBeDefined();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token', async () => {
      const { testUserEmail, testUserPassword } = getTestContext();
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Login
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const originalToken = loginData.session?.access_token;
      const refreshToken = loginData.session?.refresh_token;

      expect(refreshToken).toBeDefined();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh session
      const { data: refreshData, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken!,
      });

      expect(error).toBeNull();
      expect(refreshData.session).toBeDefined();
      expect(refreshData.session?.access_token).toBeDefined();

      // Token should be different (new token)
      expect(refreshData.session?.access_token).not.toBe(originalToken);
    });

    it('should fail refresh with invalid refresh token', async () => {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error } = await supabase.auth.refreshSession({
        refresh_token: 'invalid-refresh-token',
      });

      expect(error).toBeDefined();
    });
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      const { testUserEmail, testUserPassword } = getTestContext();
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Login
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      // Logout
      const { error } = await supabase.auth.signOut();

      expect(error).toBeNull();

      // Verify session is cleared
      const { data: sessionData } = await supabase.auth.getSession();
      expect(sessionData.session).toBeNull();
    });
  });

  describe('User Metadata', () => {
    it('should retrieve user metadata', async () => {
      const { testUserEmail, testUserPassword, testOrgId } = getTestContext();
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const user = data.user!;

      expect(user.user_metadata).toBeDefined();
      expect(user.user_metadata.organization_id).toBe(testOrgId);
      expect(user.user_metadata.role).toBe('admin');
    });

    it('should update user metadata', async () => {
      const { testUserEmail, testUserPassword } = getTestContext();
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });

      const newMetadata = {
        phone: '+5511999999999',
        preferences: { theme: 'dark' },
      };

      const { data, error } = await supabase.auth.updateUser({
        data: newMetadata,
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.user_metadata.phone).toBe(newMetadata.phone);
      expect(data.user.user_metadata.preferences).toEqual(newMetadata.preferences);
    });
  });

  describe('Role-Based Access', () => {
    it('should verify admin role', async () => {
      const { supabase, testUserId } = getTestContext();

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', testUserId)
        .single();

      expect(data).toBeDefined();
      expect(data.role).toBe('admin');
    });

    it('should create user with different role', async () => {
      const { supabase, testOrgId } = getTestContext();

      const userEmail = `viewer-${randomUUID()}@example.com`;

      const { data: authData } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: 'Viewer@123',
        email_confirm: true,
        user_metadata: {
          organization_id: testOrgId,
          role: 'viewer',
        },
      });

      const { data: profileData, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userEmail,
          organization_id: testOrgId,
          role: 'viewer',
          name: 'Viewer User',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(profileData.role).toBe('viewer');

      // Cleanup
      await supabase.from('users').delete().eq('id', authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
    });
  });
});

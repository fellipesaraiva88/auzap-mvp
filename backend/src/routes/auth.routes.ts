import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import type { TablesInsert } from '../types/database.types.js';

const router = Router();

// Register organization and first user
router.post('/register', async (req, res) => {
  try {
    const { organizationName, email, password, fullName } = req.body;

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      logger.error('Auth user creation failed', authError);
      return res.status(400).json({ error: authError.message });
    }

    // Create organization
    const orgData: TablesInsert<'organizations'> = {
      name: organizationName,
      email,
      settings: {}
    };
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert(orgData)
      .select()
      .single();

    if (orgError) {
      logger.error('Organization creation failed', orgError);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(400).json({ error: orgError.message });
    }

    // Create user record
    const userData: TablesInsert<'users'> = {
      organization_id: org.id,
      email,
      full_name: fullName,
      role: 'owner',
      auth_user_id: authUser.user.id
    };
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      logger.error('User creation failed', userError);
      return res.status(400).json({ error: userError.message });
    }

    // Create organization settings
    const settingsData: TablesInsert<'organization_settings'> = {
      organization_id: org.id
    };
    await supabaseAdmin
      .from('organization_settings')
      .insert(settingsData);

    res.json({
      success: true,
      organization: org,
      user
    });
  } catch (error: any) {
    logger.error('Registration error', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      success: true,
      session: data.session,
      user: data.user
    });
  } catch (error: any) {
    logger.error('Login error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*, organizations(*)')
      .eq('auth_user_id', user.id)
      .single();

    res.json({ user: profile });
  } catch (error: any) {
    logger.error('Get user error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

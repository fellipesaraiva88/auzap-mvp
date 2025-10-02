import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/auth/login
 * Login com email e senha
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Login via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Buscar dados do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('auth_user_id', data.user.id)
      .single();

    logger.info({ userId: data.user.id }, 'User logged in');

    res.json({
      user: data.user,
      session: data.session,
      userData,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error logging in');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout
 */
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error logging out');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Obter usuário atual
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('auth_user_id', user.id)
      .single();

    res.json({ user, userData });
  } catch (error: any) {
    logger.error({ error }, 'Error getting current user');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, organization_name } = req.body;

    if (!email || !password || !full_name || !organization_name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Criar organização
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization_name,
      })
      .select()
      .single();

    if (orgError) {
      logger.error({ error: orgError }, 'Error creating organization');
      return res.status(500).json({ error: orgError.message });
    }

    // Criar usuário na tabela users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        organization_id: org.id,
        email,
        full_name,
        role: 'admin',
      })
      .select()
      .single();

    if (userError) {
      logger.error({ error: userError }, 'Error creating user record');
      return res.status(500).json({ error: userError.message });
    }

    // Criar configurações padrão da organização
    await supabase.from('organization_settings').insert({
      organization_id: org.id,
      ai_config: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
      },
      business_hours: {
        start: '08:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5, 6],
      },
    });

    logger.info(
      { userId: authData.user.id, organizationId: org.id },
      'User registered'
    );

    res.json({
      user: authData.user,
      session: authData.session,
      userData: user,
      organization: org,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error registering user');
    res.status(500).json({ error: error.message });
  }
});

export default router;

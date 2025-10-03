import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger.js';

const router = Router();

/**
 * DEBUG ENDPOINT - REMOVER EM PRODUÇÃO
 * Verifica se o hash de senha está correto
 */
router.post('/debug-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const { data: user, error } = await (supabaseAdmin as any)
      .from('internal_users')
      .select('email, password_hash, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      res.json({
        found: false,
        error: error?.message || 'User not found'
      });
      return;
    }

    // Testar senha
    const isValid = await bcrypt.compare(password, user.password_hash);

    res.json({
      found: true,
      email: user.email,
      is_active: user.is_active,
      password_valid: isValid,
      hash_preview: user.password_hash.substring(0, 20) + '...',
      hash_length: user.password_hash.length
    });
  } catch (error: any) {
    logger.error({ error }, 'Debug password check error');
    res.status(500).json({ error: error.message });
  }
});

export default router;

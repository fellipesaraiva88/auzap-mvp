import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';

const supabaseUrl = process.env.SUPABASE_URL;
// Support both SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_ROLE_KEY for backwards compatibility
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// DEBUG: Log env vars status at startup
console.log('[Supabase Config] Environment check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeySource: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' :
                    process.env.SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY' : 'NONE',
  serviceKeyPreview: supabaseServiceKey ? supabaseServiceKey.substring(0, 30) + '...' : 'NOT SET',
  allSupabaseEnvVars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
});

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client (bypasses RLS, use carefully)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Anon client (respects RLS)
export const supabase = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseServiceKey
);

export type SupabaseClient = typeof supabaseAdmin;

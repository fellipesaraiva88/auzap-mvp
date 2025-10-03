import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase';
import { logger } from '../src/config/logger';

const CORRECT_PASSWORD_HASH = '$2b$10$l4WIe0uNHDVaesrbls16l.ffUf0bdl9KQQC8t8TvHRzyOKOTbvWyy';

async function fixInternalUsers() {
  try {
    logger.info('Fixing internal users password hashes...');

    const emails = [
      'eu@saraiva.ai',
      'admin@auzap.com',
      'julio@auzap.com',
      'arthur@auzap.com',
      'leo@auzap.com',
      'joaquim@auzap.com',
      'leticia@auzap.com'
    ];

    // Update all users
    const { data, error } = await (supabaseAdmin as any)
      .from('internal_users')
      .update({ password_hash: CORRECT_PASSWORD_HASH })
      .in('email', emails)
      .select('email');

    if (error) {
      logger.error({ error }, 'Error updating internal users');
      process.exit(1);
    }

    logger.info({ updatedUsers: data }, 'Successfully updated internal users');
    logger.info('Password for all users: AuZap2025!');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Fatal error in fix-internal-users script');
    process.exit(1);
  }
}

fixInternalUsers();

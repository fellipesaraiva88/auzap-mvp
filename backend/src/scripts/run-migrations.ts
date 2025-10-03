import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase.js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../config/logger.js';

async function runMigrations() {
  try {
    const migrationsPath = join(process.cwd(), '..', 'supabase', 'migrations');
    
    // Ler todos os arquivos de migration
    const files = await readdir(migrationsPath);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    logger.info({ count: sqlFiles.length }, 'Migrations encontradas');
    
    for (const file of sqlFiles) {
      const filePath = join(migrationsPath, file);
      const sql = await readFile(filePath, 'utf-8');
      
      try {
        logger.info({ file }, 'Executando migration...');
        
        // Executar SQL diretamente
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: sql
        });
        
        if (error) {
          logger.error({ file, error }, 'Erro na migration');
        } else {
          logger.info({ file }, 'Migration executada com sucesso');
        }
      } catch (err: any) {
        logger.error({ file, error: err }, 'Erro ao executar migration');
      }
    }
    
    logger.info('Todas as migrations foram processadas');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Erro fatal ao executar migrations');
    process.exit(1);
  }
}

runMigrations();
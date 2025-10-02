import { supabase } from '../config/supabase';
import { getCurrentTenant } from '../middleware/tenant.middleware';
import { logger } from '../config/logger';

/**
 * Wrapper do Supabase que automaticamente adiciona filtro de tenant
 */
export class TenantAwareSupabase {
  /**
   * Obter client Supabase com filtro de tenant automático
   */
  static getClient() {
    const context = getCurrentTenant();

    if (!context) {
      throw new Error('Tenant context not available. Use tenantMiddleware first.');
    }

    return {
      organizationId: context.organizationId,
      userId: context.userId,

      /**
       * Select com filtro automático de tenant
       */
      from: (table: string) => {
        const query = supabase.from(table);

        // Adicionar filtro automático de organization_id se a tabela tiver essa coluna
        const tablesWithOrgId = [
          'users',
          'whatsapp_instances',
          'services',
          'contacts',
          'pets',
          'bookings',
          'conversations',
          'messages',
          'ai_interactions',
          'scheduled_followups',
          'aurora_proactive_messages',
          'aurora_automations',
          'organization_settings'
        ];

        if (tablesWithOrgId.includes(table)) {
          return {
            select: (columns: string = '*') =>
              query.select(columns).eq('organization_id', context.organizationId),

            insert: (data: any) =>
              query.insert({ ...data, organization_id: context.organizationId }),

            update: (data: any) =>
              query.update(data).eq('organization_id', context.organizationId),

            delete: () =>
              query.delete().eq('organization_id', context.organizationId),

            upsert: (data: any) =>
              query.upsert({ ...data, organization_id: context.organizationId })
          };
        }

        // Para tabelas sem organization_id, retornar query normal
        return query;
      }
    };
  }

  /**
   * Validar se recurso pertence ao tenant atual
   */
  static async validateResourceAccess(
    table: string,
    resourceId: string,
    idColumn: string = 'id'
  ): Promise<boolean> {
    const context = getCurrentTenant();

    if (!context) {
      logger.warn('No tenant context for resource validation');
      return false;
    }

    const { data, error } = await supabase
      .from(table)
      .select('organization_id')
      .eq(idColumn, resourceId)
      .single();

    if (error || !data) {
      logger.warn({ table, resourceId, error }, 'Resource not found');
      return false;
    }

    if (data.organization_id !== context.organizationId) {
      logger.warn({
        currentTenant: context.organizationId,
        resourceTenant: data.organization_id,
        table,
        resourceId
      }, 'Cross-tenant access attempt blocked');
      return false;
    }

    return true;
  }

  /**
   * Criar query RLS-aware (usa RLS do Supabase automaticamente)
   */
  static async executeRLSQuery<T>(
    callback: () => Promise<T>
  ): Promise<T> {
    const context = getCurrentTenant();

    if (!context) {
      throw new Error('Tenant context required for RLS queries');
    }

    // Executar query - RLS policies do Supabase irão filtrar automaticamente
    return callback();
  }
}

/**
 * Helper para criar audit log de operações
 */
export async function createAuditLog(
  action: string,
  table: string,
  resourceId: string,
  changes?: any
) {
  const context = getCurrentTenant();

  if (!context) {
    logger.warn('No tenant context for audit log');
    return;
  }

  // TODO: Criar tabela audit_logs se necessário
  logger.info({
    organizationId: context.organizationId,
    userId: context.userId,
    action,
    table,
    resourceId,
    changes,
    timestamp: new Date().toISOString()
  }, 'Audit log created');
}

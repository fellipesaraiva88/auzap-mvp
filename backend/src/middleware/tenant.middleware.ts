import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

// Async Local Storage para contexto de tenant
export const tenantContext = new AsyncLocalStorage<{ organizationId: string; userId?: string }>();

/**
 * Middleware para extrair e validar tenant (organization) do request
 * Garante isolamento multi-tenant em todas as requisições
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extrair organizationId de diferentes fontes
    let organizationId: string | undefined;
    let userId: string | undefined;

    // 1. Tentar extrair do header Authorization (JWT)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        // Buscar dados do usuário e sua organização
        const { data: userData } = await supabase
          .from('users')
          .select('id, organization_id')
          .eq('auth_user_id', user.id)
          .single();

        if (userData) {
          organizationId = userData.organization_id;
          userId = userData.id;
        }
      }
    }

    // 2. Fallback: header customizado X-Organization-Id (para casos especiais)
    if (!organizationId) {
      organizationId = req.headers['x-organization-id'] as string;
    }

    // 3. Fallback: query parameter (apenas para webhooks/public endpoints)
    if (!organizationId && req.query.organizationId) {
      organizationId = req.query.organizationId as string;
    }

    // 4. Fallback: body (para POSTs sem auth)
    if (!organizationId && req.body?.organizationId) {
      organizationId = req.body.organizationId;
    }

    // Validar se organizationId foi encontrado
    if (!organizationId) {
      logger.warn({
        path: req.path,
        method: req.method
      }, 'Tenant middleware: organizationId not found');

      return res.status(400).json({
        error: 'Organization ID is required',
        message: 'Please provide a valid organization identifier'
      });
    }

    // Validar se organização existe
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, subscription_status')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      logger.warn({ organizationId }, 'Invalid organization ID');
      return res.status(404).json({
        error: 'Organization not found',
        message: 'The specified organization does not exist'
      });
    }

    // Verificar se organização está ativa
    if (org.subscription_status === 'suspended' || org.subscription_status === 'cancelled') {
      logger.warn({ organizationId, status: org.subscription_status }, 'Organization is not active');
      return res.status(403).json({
        error: 'Organization suspended',
        message: 'This organization subscription is not active'
      });
    }

    // Armazenar no contexto async
    tenantContext.run({ organizationId, userId }, () => {
      // Adicionar ao request para uso posterior
      (req as any).organizationId = organizationId;
      (req as any).userId = userId;

      logger.debug({ organizationId, userId, path: req.path }, 'Tenant context set');

      next();
    });

  } catch (error: any) {
    logger.error({ error, path: req.path }, 'Tenant middleware error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process tenant context'
    });
  }
}

/**
 * Helper para obter tenant do contexto atual
 */
export function getCurrentTenant(): { organizationId: string; userId?: string } | undefined {
  return tenantContext.getStore();
}

/**
 * Helper para verificar se usuário pertence ao tenant atual
 */
export function validateTenantAccess(resourceOrganizationId: string): boolean {
  const context = getCurrentTenant();

  if (!context) {
    logger.warn('No tenant context available');
    return false;
  }

  if (context.organizationId !== resourceOrganizationId) {
    logger.warn({
      currentTenant: context.organizationId,
      resourceTenant: resourceOrganizationId
    }, 'Cross-tenant access attempt blocked');
    return false;
  }

  return true;
}

/**
 * Decorator para garantir isolamento de tenant em funções
 */
export function requireTenant() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = getCurrentTenant();

      if (!context) {
        throw new Error('Tenant context is required but not available');
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

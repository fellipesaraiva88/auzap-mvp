import { useAuthStore } from '@/store/auth';
import { useMemo } from 'react';

/**
 * Hook para acessar informações do tenant (organização) atual
 */
export function useTenant() {
  const { user, organization } = useAuthStore();

  const tenantInfo = useMemo(() => {
    if (!user || !organization) {
      return null;
    }

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      businessType: organization.business_type,
      subscriptionTier: organization.subscription_tier,
      subscriptionStatus: organization.subscription_status,
      features: organization.features || {},
      limits: {
        maxUsers: organization.max_users || 5,
        maxWhatsappInstances: organization.max_whatsapp_instances || 1,
        maxPets: organization.max_pets || 100,
      },
      userId: user.id,
      userRole: user.role,
      userPermissions: user.permissions || [],
    };
  }, [user, organization]);

  const hasFeature = (feature: string): boolean => {
    if (!tenantInfo) return false;
    return tenantInfo.features[feature] === true;
  };

  const hasPermission = (permission: string): boolean => {
    if (!tenantInfo) return false;
    return tenantInfo.userPermissions.includes(permission);
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!tenantInfo) return false;

    // Verificar se tem a feature habilitada
    if (!hasFeature(feature)) return false;

    // Verificar status da subscription
    if (
      tenantInfo.subscriptionStatus !== 'active' &&
      tenantInfo.subscriptionStatus !== 'trial'
    ) {
      return false;
    }

    return true;
  };

  const isOwner = (): boolean => {
    if (!tenantInfo) return false;
    return tenantInfo.userRole === 'owner';
  };

  const isAdmin = (): boolean => {
    if (!tenantInfo) return false;
    return tenantInfo.userRole === 'owner' || tenantInfo.userRole === 'admin';
  };

  return {
    tenantInfo,
    organizationId: tenantInfo?.organizationId || '',
    hasFeature,
    hasPermission,
    canAccessFeature,
    isOwner,
    isAdmin,
    isLoading: !user || !organization,
  };
}

/**
 * Helper para criar headers com tenant info
 */
export function useTenantHeaders() {
  const { tenantInfo } = useTenant();

  return useMemo(() => {
    if (!tenantInfo) return {};

    return {
      'X-Organization-Id': tenantInfo.organizationId,
    };
  }, [tenantInfo]);
}

/**
 * Helper para criar query params com tenant info
 */
export function useTenantQueryParams() {
  const { tenantInfo } = useTenant();

  return useMemo(() => {
    if (!tenantInfo) return {};

    return {
      organizationId: tenantInfo.organizationId,
    };
  }, [tenantInfo]);
}

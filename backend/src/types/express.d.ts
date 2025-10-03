/**
 * Global Express type extensions
 * Consolidates all Request extensions in one place
 */

import { type InternalRole, type AdminJWTPayload } from '../services/admin-auth.service.js';

declare global {
  namespace Express {
    interface Request {
      // Tenant middleware properties
      organizationId?: string;
      userId?: string;
      userRole?: 'owner' | 'admin' | 'agent';

      // Aurora auth middleware properties
      auroraContext?: {
        organizationId: string;
        phoneNumber: string;
        organizationName: string;
        ownerName: string;
        isOwner: boolean;
        role: 'owner' | 'admin';
      };

      // Admin auth middleware properties
      admin?: AdminJWTPayload & {
        id: string;
      };
    }
  }
}

export {};

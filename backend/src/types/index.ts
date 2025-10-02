export interface BaileysInstance {
  socket: any;
  organizationId: string;
  instanceId: string;
  reconnectAttempts: number;
  isConnecting: boolean;
  pairingMethod: 'code' | 'qr';
}

export interface SessionData {
  creds: any;
  keys: any;
}

export type PairingMethod = 'code' | 'qr';

export interface AuroraContext {
  isOwner: boolean;
  organizationId?: string;
  userId?: string;
  ownerNumberId?: string;
  permissions?: any;
  auroraSettings?: any;
}

export interface AuroraMessage {
  organizationId: string;
  ownerNumberId: string;
  content: string;
  context: AuroraContext;
}

export interface MessageJob {
  organizationId: string;
  instanceId: string;
  message: any;
}

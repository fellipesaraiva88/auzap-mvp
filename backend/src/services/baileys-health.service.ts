import { WASocket } from '@whiskeysockets/baileys';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { BaileysInstance } from '../types';

export interface HealthStatus {
  instanceId: string;
  organizationId: string;
  connected: boolean;
  uptime: number;
  stats: {
    messagesProcessed: number;
    messagesSent: number;
    messagesReceived: number;
    reconnectAttempts: number;
    lastReconnect?: string;
  };
  lastError?: {
    message: string;
    timestamp: string;
    code?: string;
  };
  sessionHealth: {
    hasValidCreds: boolean;
    hasValidKeys: boolean;
    lastBackup?: string;
  };
  qrCodeStatus?: {
    generated: boolean;
    expiresAt?: string;
    expired: boolean;
  };
  rateLimiting: {
    messagesInLastMinute: number;
    throttled: boolean;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

export interface DiagnosticInfo {
  instanceId: string;
  checks: {
    connection: {
      status: 'ok' | 'warning' | 'error';
      details: string;
    };
    session: {
      status: 'ok' | 'warning' | 'error';
      details: string;
    };
    performance: {
      status: 'ok' | 'warning' | 'error';
      details: string;
    };
    rateLimit: {
      status: 'ok' | 'warning' | 'error';
      details: string;
    };
  };
  recommendations: string[];
}

export class BaileysHealthService {
  private static instanceStats = new Map<string, {
    messagesProcessed: number;
    messagesSent: number;
    messagesReceived: number;
    startTime: number;
    lastError?: { message: string; timestamp: string; code?: string };
    messagesTimestamps: number[]; // Para rate limiting tracking
  }>();

  /**
   * Obter status de saúde detalhado de uma instância
   */
  static async getHealthStatus(
    organizationId: string,
    instanceId: string,
    instance?: BaileysInstance
  ): Promise<HealthStatus> {
    const key = `${organizationId}:${instanceId}`;
    const stats = this.instanceStats.get(key) || {
      messagesProcessed: 0,
      messagesSent: 0,
      messagesReceived: 0,
      startTime: Date.now(),
      messagesTimestamps: [],
    };

    // Buscar dados do banco
    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    const sessionData = instanceData?.session_data || {};
    const qrCode = instanceData?.qr_code;
    const pairingCodeExpiresAt = instanceData?.pairing_code_expires_at;

    // Calcular mensagens no último minuto
    const oneMinuteAgo = Date.now() - 60000;
    const messagesInLastMinute = stats.messagesTimestamps.filter(
      ts => ts > oneMinuteAgo
    ).length;

    // Memory usage
    const memUsage = process.memoryUsage();

    return {
      instanceId,
      organizationId,
      connected: instance?.socket?.user?.id != null,
      uptime: Date.now() - stats.startTime,
      stats: {
        messagesProcessed: stats.messagesProcessed,
        messagesSent: stats.messagesSent,
        messagesReceived: stats.messagesReceived,
        reconnectAttempts: instance?.reconnectAttempts || 0,
        lastReconnect: instance?.reconnectAttempts ? new Date().toISOString() : undefined,
      },
      lastError: stats.lastError,
      sessionHealth: {
        hasValidCreds: !!sessionData.creds,
        hasValidKeys: !!sessionData.keys,
        lastBackup: instanceData?.updated_at,
      },
      qrCodeStatus: qrCode ? {
        generated: true,
        expiresAt: pairingCodeExpiresAt,
        expired: pairingCodeExpiresAt ? new Date(pairingCodeExpiresAt) < new Date() : false,
      } : undefined,
      rateLimiting: {
        messagesInLastMinute,
        throttled: messagesInLastMinute >= 20,
      },
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
    };
  }

  /**
   * Executar diagnóstico completo
   */
  static async runDiagnostics(
    organizationId: string,
    instanceId: string,
    instance?: BaileysInstance
  ): Promise<DiagnosticInfo> {
    const health = await this.getHealthStatus(organizationId, instanceId, instance);
    const recommendations: string[] = [];

    // Check connection
    const connectionCheck = {
      status: 'ok' as 'ok' | 'warning' | 'error',
      details: 'Connection is healthy',
    };

    if (!health.connected) {
      connectionCheck.status = 'error';
      connectionCheck.details = 'Instance is not connected to WhatsApp';
      recommendations.push('Reconnect instance using /connect endpoint');
    } else if (health.stats.reconnectAttempts > 2) {
      connectionCheck.status = 'warning';
      connectionCheck.details = `Multiple reconnect attempts detected (${health.stats.reconnectAttempts})`;
      recommendations.push('Check network stability and WhatsApp service status');
    }

    // Check session
    const sessionCheck = {
      status: 'ok' as 'ok' | 'warning' | 'error',
      details: 'Session data is valid',
    };

    if (!health.sessionHealth.hasValidCreds || !health.sessionHealth.hasValidKeys) {
      sessionCheck.status = 'error';
      sessionCheck.details = 'Session credentials or keys are missing or invalid';
      recommendations.push('Clear session and reconnect with fresh QR/pairing code');
    }

    if (health.qrCodeStatus?.expired) {
      sessionCheck.status = 'warning';
      sessionCheck.details = 'QR Code has expired';
      recommendations.push('Generate new QR code or pairing code');
    }

    // Check performance
    const performanceCheck = {
      status: 'ok' as 'ok' | 'warning' | 'error',
      details: 'Performance is normal',
    };

    const uptimeHours = health.uptime / (1000 * 60 * 60);
    if (uptimeHours > 24 && health.stats.messagesProcessed < 10) {
      performanceCheck.status = 'warning';
      performanceCheck.details = 'Low message throughput detected';
      recommendations.push('Monitor message processing pipeline');
    }

    if (health.memoryUsage.heapUsed / health.memoryUsage.heapTotal > 0.9) {
      performanceCheck.status = 'warning';
      performanceCheck.details = 'High memory usage detected';
      recommendations.push('Consider restarting instance to free memory');
    }

    // Check rate limiting
    const rateLimitCheck = {
      status: 'ok' as 'ok' | 'warning' | 'error',
      details: 'Rate limiting is healthy',
    };

    if (health.rateLimiting.throttled) {
      rateLimitCheck.status = 'error';
      rateLimitCheck.details = `Rate limit exceeded: ${health.rateLimiting.messagesInLastMinute} messages/min`;
      recommendations.push('Reduce message sending rate to avoid WhatsApp blocks');
    } else if (health.rateLimiting.messagesInLastMinute > 15) {
      rateLimitCheck.status = 'warning';
      rateLimitCheck.details = `Approaching rate limit: ${health.rateLimiting.messagesInLastMinute} messages/min`;
      recommendations.push('Monitor sending rate closely');
    }

    return {
      instanceId,
      checks: {
        connection: connectionCheck,
        session: sessionCheck,
        performance: performanceCheck,
        rateLimit: rateLimitCheck,
      },
      recommendations,
    };
  }

  /**
   * Incrementar contador de mensagens
   */
  static incrementMessageCount(organizationId: string, instanceId: string, type: 'sent' | 'received') {
    const key = `${organizationId}:${instanceId}`;
    const stats = this.instanceStats.get(key) || {
      messagesProcessed: 0,
      messagesSent: 0,
      messagesReceived: 0,
      startTime: Date.now(),
      messagesTimestamps: [],
    };

    stats.messagesProcessed++;
    if (type === 'sent') {
      stats.messagesSent++;
    } else {
      stats.messagesReceived++;
    }
    stats.messagesTimestamps.push(Date.now());

    // Limpar timestamps antigos (> 1 minuto)
    const oneMinuteAgo = Date.now() - 60000;
    stats.messagesTimestamps = stats.messagesTimestamps.filter(ts => ts > oneMinuteAgo);

    this.instanceStats.set(key, stats);
  }

  /**
   * Registrar erro
   */
  static recordError(organizationId: string, instanceId: string, error: Error, code?: string) {
    const key = `${organizationId}:${instanceId}`;
    const stats = this.instanceStats.get(key) || {
      messagesProcessed: 0,
      messagesSent: 0,
      messagesReceived: 0,
      startTime: Date.now(),
      messagesTimestamps: [],
    };

    stats.lastError = {
      message: error.message,
      timestamp: new Date().toISOString(),
      code,
    };

    this.instanceStats.set(key, stats);

    logger.error({ error, organizationId, instanceId, code }, 'Instance error recorded');
  }

  /**
   * Validar session data
   */
  static validateSessionData(sessionData: any): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!sessionData) {
      issues.push('Session data is null or undefined');
      return { valid: false, issues };
    }

    if (!sessionData.creds) {
      issues.push('Missing credentials in session data');
    } else {
      if (!sessionData.creds.me) {
        issues.push('Missing user info in credentials');
      }
      if (!sessionData.creds.signalIdentities) {
        issues.push('Missing signal identities in credentials');
      }
    }

    if (!sessionData.keys) {
      issues.push('Missing keys in session data');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Backup de sessão
   */
  static async backupSession(organizationId: string, instanceId: string): Promise<boolean> {
    try {
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('session_data')
        .eq('id', instanceId)
        .single();

      if (!instanceData?.session_data) {
        return false;
      }

      // Criar backup na tabela de backups (criar se não existir)
      await supabase.from('whatsapp_session_backups').insert({
        instance_id: instanceId,
        organization_id: organizationId,
        session_data: instanceData.session_data,
        created_at: new Date().toISOString(),
      });

      logger.info({ organizationId, instanceId }, 'Session backed up successfully');
      return true;
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to backup session');
      return false;
    }
  }

  /**
   * Limpar estatísticas antigas
   */
  static clearStats(organizationId: string, instanceId: string) {
    const key = `${organizationId}:${instanceId}`;
    this.instanceStats.delete(key);
  }
}

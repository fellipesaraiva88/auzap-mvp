import { DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { BaileysInstance } from '../types';
import { io } from '../index';

export interface ReconnectConfig {
  maxAttempts: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  resetAfterSuccess: boolean;
}

const DEFAULT_CONFIG: ReconnectConfig = {
  maxAttempts: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  resetAfterSuccess: true,
};

export class BaileysReconnectService {
  private static reconnectTimers = new Map<string, NodeJS.Timeout>();
  private static reconnectHistory = new Map<string, {
    attempts: number;
    lastAttempt: number;
    successfulReconnects: number;
    failedReconnects: number;
  }>();

  /**
   * Calcular delay com exponential backoff
   */
  private static calculateDelay(attempt: number, config: ReconnectConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Determinar se deve reconectar
   */
  static shouldReconnect(
    lastDisconnect: any,
    instance: BaileysInstance,
    config: ReconnectConfig = DEFAULT_CONFIG
  ): {
    shouldReconnect: boolean;
    reason: string;
    isLogout: boolean;
  } {
    // Verificar se foi logout
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
    const isLogout = statusCode === DisconnectReason.loggedOut;

    if (isLogout) {
      return {
        shouldReconnect: false,
        reason: 'User logged out - manual reconnection required',
        isLogout: true,
      };
    }

    // Verificar se atingiu limite de tentativas
    if (instance.reconnectAttempts >= config.maxAttempts) {
      return {
        shouldReconnect: false,
        reason: `Maximum reconnection attempts (${config.maxAttempts}) reached`,
        isLogout: false,
      };
    }

    // Verificar tipos de erro que não devem reconectar
    const errorMessage = lastDisconnect?.error?.message?.toLowerCase() || '';

    const nonRecoverableErrors = [
      'session_corrupted',
      'invalid_credentials',
      'account_banned',
      'rate_overlimit',
    ];

    const hasNonRecoverableError = nonRecoverableErrors.some(err =>
      errorMessage.includes(err)
    );

    if (hasNonRecoverableError) {
      return {
        shouldReconnect: false,
        reason: `Non-recoverable error detected: ${errorMessage}`,
        isLogout: false,
      };
    }

    return {
      shouldReconnect: true,
      reason: 'Temporary disconnection - attempting reconnect',
      isLogout: false,
    };
  }

  /**
   * Executar reconexão com retry lógico
   */
  static async attemptReconnect(
    instance: BaileysInstance,
    reconnectFn: () => Promise<void>,
    config: ReconnectConfig = DEFAULT_CONFIG
  ): Promise<{
    success: boolean;
    attempt: number;
    nextRetryIn?: number;
  }> {
    const key = `${instance.organizationId}:${instance.instanceId}`;

    // Cancelar timer anterior se existir
    const existingTimer = this.reconnectTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Incrementar tentativa
    instance.reconnectAttempts++;

    // Atualizar histórico
    const history = this.reconnectHistory.get(key) || {
      attempts: 0,
      lastAttempt: 0,
      successfulReconnects: 0,
      failedReconnects: 0,
    };

    history.attempts++;
    history.lastAttempt = Date.now();
    this.reconnectHistory.set(key, history);

    try {
      // Calcular delay
      const delayMs = this.calculateDelay(instance.reconnectAttempts, config);

      logger.info({
        instanceId: instance.instanceId,
        attempt: instance.reconnectAttempts,
        maxAttempts: config.maxAttempts,
        delayMs,
      }, 'Attempting reconnection');

      // Atualizar status no banco
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'reconnecting',
          reconnect_attempts: instance.reconnectAttempts,
          last_reconnect_at: new Date().toISOString(),
        })
        .eq('id', instance.instanceId);

      // Emitir evento via Socket.IO
      io.to(`org-${instance.organizationId}`).emit('whatsapp:reconnecting', {
        instanceId: instance.instanceId,
        attempt: instance.reconnectAttempts,
        maxAttempts: config.maxAttempts,
        nextRetryIn: delayMs,
      });

      // Aguardar delay
      await delay(delayMs);

      // Executar reconexão
      await reconnectFn();

      // Sucesso
      history.successfulReconnects++;
      this.reconnectHistory.set(key, history);

      // Reset tentativas se configurado
      if (config.resetAfterSuccess) {
        instance.reconnectAttempts = 0;
      }

      logger.info({
        instanceId: instance.instanceId,
        attempt: instance.reconnectAttempts,
      }, 'Reconnection successful');

      return {
        success: true,
        attempt: instance.reconnectAttempts,
      };
    } catch (error: any) {
      history.failedReconnects++;
      this.reconnectHistory.set(key, history);

      logger.error({
        error,
        instanceId: instance.instanceId,
        attempt: instance.reconnectAttempts,
      }, 'Reconnection failed');

      // Se ainda há tentativas, agendar próxima
      if (instance.reconnectAttempts < config.maxAttempts) {
        const nextDelay = this.calculateDelay(instance.reconnectAttempts + 1, config);

        const timer = setTimeout(async () => {
          await this.attemptReconnect(instance, reconnectFn, config);
        }, nextDelay);

        this.reconnectTimers.set(key, timer);

        return {
          success: false,
          attempt: instance.reconnectAttempts,
          nextRetryIn: nextDelay,
        };
      }

      // Máximo de tentativas atingido
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'disconnected',
          reconnect_attempts: instance.reconnectAttempts,
        })
        .eq('id', instance.instanceId);

      io.to(`org-${instance.organizationId}`).emit('whatsapp:reconnect-failed', {
        instanceId: instance.instanceId,
        reason: 'Maximum reconnection attempts reached',
      });

      return {
        success: false,
        attempt: instance.reconnectAttempts,
      };
    }
  }

  /**
   * Cancelar reconexão em andamento
   */
  static cancelReconnect(organizationId: string, instanceId: string) {
    const key = `${organizationId}:${instanceId}`;
    const timer = this.reconnectTimers.get(key);

    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(key);
      logger.info({ organizationId, instanceId }, 'Reconnection cancelled');
    }
  }

  /**
   * Obter histórico de reconexões
   */
  static getReconnectHistory(organizationId: string, instanceId: string) {
    const key = `${organizationId}:${instanceId}`;
    return this.reconnectHistory.get(key);
  }

  /**
   * Limpar histórico
   */
  static clearHistory(organizationId: string, instanceId: string) {
    const key = `${organizationId}:${instanceId}`;
    this.reconnectHistory.delete(key);
    this.reconnectTimers.delete(key);
  }

  /**
   * Validar session antes de reconectar
   */
  static async validateSessionBeforeReconnect(
    organizationId: string,
    instanceId: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('session_data')
        .eq('id', instanceId)
        .single();

      const issues: string[] = [];

      if (!instanceData?.session_data) {
        issues.push('No session data found');
        return { valid: false, issues };
      }

      const sessionData = instanceData.session_data as any;

      if (!sessionData.creds) {
        issues.push('Missing credentials');
      }

      if (!sessionData.keys) {
        issues.push('Missing encryption keys');
      }

      if (sessionData.creds && !sessionData.creds.me) {
        issues.push('Missing user information in credentials');
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to validate session');
      return {
        valid: false,
        issues: ['Failed to retrieve session data'],
      };
    }
  }
}

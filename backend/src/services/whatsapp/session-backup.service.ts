import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Session Backup Service
 *
 * Faz backup criptografado de sessões WhatsApp (Baileys) no Supabase
 * Permite restauração em caso de falha no filesystem (/app/data/sessions)
 *
 * Segurança:
 * - AES-256-GCM encryption
 * - IV (Initialization Vector) único por sessão
 * - Encryption key derivada do ENCRYPTION_KEY env var
 */
export class SessionBackupService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-dev-key-change-in-prod';

    // Derivar 32-byte key usando SHA-256
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(key)
      .digest();
  }

  /**
   * Criptografa dados JSON usando AES-256-GCM
   */
  private encrypt(data: any): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    const jsonStr = JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Adicionar auth tag para verificação de integridade
    const authTag = cipher.getAuthTag();
    encrypted += authTag.toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Descriptografa dados AES-256-GCM
   */
  private decrypt(encrypted: string, ivHex: string): any {
    const iv = Buffer.from(ivHex, 'hex');

    // Separar auth tag (últimos 16 bytes em hex = 32 chars)
    const authTag = encrypted.slice(-32);
    const encryptedData = encrypted.slice(0, -32);

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Faz backup de sessão Baileys no Supabase
   */
  async backupSession(
    organizationId: string,
    instanceId: string,
    sessionPath: string,
    phoneNumber?: string
  ): Promise<void> {
    try {
      // Ler creds.json do filesystem
      const credsPath = path.join(sessionPath, 'creds.json');
      const credsData = await fs.readFile(credsPath, 'utf-8');
      const creds = JSON.parse(credsData);

      // Criptografar
      const { encrypted, iv } = this.encrypt(creds);

      // Salvar no Supabase (upsert: sobrescreve se já existir)
      const { error } = await supabaseAdmin
        .from('whatsapp_session_backups')
        .upsert({
          organization_id: organizationId,
          instance_id: instanceId,
          encrypted_creds: encrypted,
          encryption_iv: iv,
          phone_number: phoneNumber,
          auth_method: 'pairing_code',
          last_connected_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,instance_id'
        });

      if (error) throw error;

      logger.info({
        organizationId,
        instanceId,
        backupSize: encrypted.length
      }, '💾 Session backup saved to Supabase');
    } catch (error) {
      logger.error({
        error,
        organizationId,
        instanceId
      }, '❌ Failed to backup session to Supabase');
      // Não propagar erro - backup é opcional
    }
  }

  /**
   * Restaura sessão do Supabase para o filesystem
   */
  async restoreSession(
    organizationId: string,
    instanceId: string,
    sessionPath: string
  ): Promise<boolean> {
    try {
      // Buscar backup no Supabase
      const { data, error } = await supabaseAdmin
        .from('whatsapp_session_backups')
        .select('encrypted_creds, encryption_iv')
        .eq('organization_id', organizationId)
        .eq('instance_id', instanceId)
        .single();

      if (error || !data) {
        logger.warn({
          organizationId,
          instanceId
        }, '⚠️ No session backup found in Supabase');
        return false;
      }

      // Descriptografar
      const creds = this.decrypt(data.encrypted_creds as unknown as string, data.encryption_iv);

      // Garantir que diretório existe
      await fs.mkdir(sessionPath, { recursive: true, mode: 0o777 });

      // Salvar creds.json no filesystem
      const credsPath = path.join(sessionPath, 'creds.json');
      await fs.writeFile(credsPath, JSON.stringify(creds, null, 2), 'utf-8');

      logger.info({
        organizationId,
        instanceId,
        sessionPath
      }, '🔄 Session restored from Supabase backup');

      return true;
    } catch (error) {
      logger.error({
        error,
        organizationId,
        instanceId
      }, '❌ Failed to restore session from Supabase');
      return false;
    }
  }

  /**
   * Remove backup de sessão do Supabase
   */
  async deleteBackup(organizationId: string, instanceId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('whatsapp_session_backups')
        .delete()
        .eq('organization_id', organizationId)
        .eq('instance_id', instanceId);

      if (error) throw error;

      logger.info({
        organizationId,
        instanceId
      }, '🗑️ Session backup deleted from Supabase');
    } catch (error) {
      logger.error({
        error,
        organizationId,
        instanceId
      }, '❌ Failed to delete session backup');
      // Não propagar erro
    }
  }

  /**
   * Lista todos os backups de uma organização
   */
  async listBackups(organizationId: string): Promise<Array<{
    instanceId: string;
    phoneNumber?: string;
    lastConnectedAt?: string;
    createdAt: string;
  }>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_session_backups')
        .select('instance_id, phone_number, last_connected_at, created_at')
        .eq('organization_id', organizationId)
        .order('last_connected_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      return (data || []).map(row => ({
        instanceId: row.instance_id,
        phoneNumber: row.phone_number || undefined,
        lastConnectedAt: row.last_connected_at || undefined,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error({
        error,
        organizationId
      }, '❌ Failed to list session backups');
      return [];
    }
  }
}

export const sessionBackupService = new SessionBackupService();

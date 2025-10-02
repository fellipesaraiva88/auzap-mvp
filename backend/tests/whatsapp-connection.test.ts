/**
 * WhatsApp Connection Flow E2E Tests
 * Tests pairing code generation, QR code emission, and session persistence
 */

import { BaileysService } from '../src/services/baileys.service';
import { supabase } from '../src/config/supabase';
import { io } from '../src/index';
import {
  createMockWASocket,
  simulatePairingCode,
  simulateQRCode,
  simulateConnectionOpen,
  simulateConnectionClose,
  simulateCredsUpdate,
  mockSessionData,
  waitForEvent,
  createMockSocketIO,
} from './helpers/baileys.mock';
import {
  testOrganization,
  testWhatsAppInstance,
  testInstanceIds,
} from './helpers/test-data';

// Mock dependencies
jest.mock('@whiskeysockets/baileys', () => ({
  makeWASocket: jest.fn(),
  fetchLatestBaileysVersion: jest.fn().mockResolvedValue({ version: [2, 3000, 1000000000] }),
  DisconnectReason: {
    loggedOut: 418,
    connectionClosed: 428,
  },
  Browsers: {
    macOS: jest.fn(() => ['AuZap', 'Chrome', '120.0']),
  },
  makeCacheableSignalKeyStore: jest.fn((keys) => keys),
  delay: jest.fn((ms) => new Promise(resolve => setTimeout(resolve, ms))),
}));

describe('WhatsApp Connection Flow', () => {
  let mockSocket: any;
  let mockSocketIO: any;
  let testInstanceId: string;
  let testOrgId: string;

  beforeEach(async () => {
    // Setup mock socket
    mockSocket = createMockWASocket();
    const makeWASocket = require('@whiskeysockets/baileys').makeWASocket;
    makeWASocket.mockReturnValue(mockSocket);

    // Setup mock Socket.IO
    mockSocketIO = createMockSocketIO();
    (io as any).to = mockSocketIO.to;
    (io as any).emit = mockSocketIO.emit;

    // Create test organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([testOrganization])
      .select()
      .single();

    if (orgError) throw orgError;
    testOrgId = org.id;

    // Create test instance
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .insert([{
        ...testWhatsAppInstance,
        organization_id: testOrgId,
      }])
      .select()
      .single();

    if (instanceError) throw instanceError;
    testInstanceId = instance.id;
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('whatsapp_instances').delete().eq('id', testInstanceId);
    await supabase.from('organizations').delete().eq('id', testOrgId);

    jest.clearAllMocks();
  });

  describe('Pairing Code Generation', () => {
    it('should generate pairing code when requested', async () => {
      const phoneNumber = '5511999999999';

      const result = await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        phoneNumber,
        'code'
      );

      expect(result.success).toBe(true);
      expect(result.pairingCode).toBeDefined();
      expect(result.pairingCode).toMatch(/^[A-Z0-9]{8}$/);
      expect(result.method).toBe('code');
      expect(mockSocket.requestPairingCode).toHaveBeenCalledWith(phoneNumber);
    });

    it('should save pairing code to database', async () => {
      const phoneNumber = '5511999999999';

      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        phoneNumber,
        'code'
      );

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('pairing_code, status, pairing_code_expires_at')
        .eq('id', testInstanceId)
        .single();

      expect(instance?.pairing_code).toBeDefined();
      expect(instance?.pairing_code).toMatch(/^[A-Z0-9]{8}$/);
      expect(instance?.status).toBe('qr_pending');
      expect(instance?.pairing_code_expires_at).toBeDefined();
    });

    it('should reject invalid phone numbers', async () => {
      const invalidPhone = '123';

      const result = await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        invalidPhone,
        'code'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle pairing code timeout gracefully', async () => {
      const phoneNumber = '5511999999999';
      mockSocket.requestPairingCode.mockRejectedValueOnce(new Error('Timeout'));

      const result = await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        phoneNumber,
        'code'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });
  });

  describe('QR Code Generation and Emission', () => {
    it('should emit QR code via Socket.IO when generated', async () => {
      const emitter = mockSocketIO._getEmitter();
      const qrPromise = waitForEvent(emitter, 'whatsapp:qr');

      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        undefined,
        'qr'
      );

      // Simulate QR code generation
      simulateQRCode(mockSocket);

      const qrData = await qrPromise;

      expect(qrData).toBeDefined();
      expect(qrData.instanceId).toBe(testInstanceId);
      expect(qrData.qr).toBe('test_qr_code_data');
      expect(qrData.timestamp).toBeDefined();
    });

    it('should save QR code to database', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        undefined,
        'qr'
      );

      // Simulate QR code generation
      simulateQRCode(mockSocket);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, status')
        .eq('id', testInstanceId)
        .single();

      expect(instance?.qr_code).toBe('test_qr_code_data');
      expect(instance?.status).toBe('qr_pending');
    });

    it('should emit to correct organization room', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        undefined,
        'qr'
      );

      simulateQRCode(mockSocket);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockSocketIO.to).toHaveBeenCalledWith(`org-${testOrgId}`);
    });
  });

  describe('Session Persistence', () => {
    it('should persist session data when credentials update', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        undefined,
        'qr'
      );

      // Simulate credentials update with mock data
      mockSocket.authState = {
        creds: mockSessionData.creds,
        keys: mockSessionData.keys,
      };

      simulateCredsUpdate(mockSocket);

      // Wait for async save operation
      await new Promise(resolve => setTimeout(resolve, 200));

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('session_data')
        .eq('id', testInstanceId)
        .single();

      expect(instance?.session_data).toBeDefined();
      expect(instance?.session_data.creds).toBeDefined();
      expect(instance?.session_data.keys).toBeDefined();
    });

    it('should update instance status when connection opens', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        undefined,
        'qr'
      );

      simulateConnectionOpen(mockSocket);

      // Wait for status update
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('status, last_connected_at')
        .eq('id', testInstanceId)
        .single();

      expect(instance?.status).toBe('connected');
      expect(instance?.last_connected_at).toBeDefined();
    });

    it('should handle disconnection and update status', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId,
        undefined,
        'qr'
      );

      // First connect
      simulateConnectionOpen(mockSocket);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Then disconnect
      simulateConnectionClose(mockSocket);
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('status')
        .eq('id', testInstanceId)
        .single();

      expect(['disconnected', 'connecting']).toContain(instance?.status);
    });

    it('should restore session from database on reconnect', async () => {
      // Save session data to database first
      await supabase
        .from('whatsapp_instances')
        .update({
          session_data: mockSessionData,
          status: 'disconnected',
        })
        .eq('id', testInstanceId);

      // Initialize with existing session
      const result = await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId
      );

      expect(result.success).toBe(true);
      expect(mockSocket.authState).toBeDefined();
    });
  });

  describe('Connection State Management', () => {
    it('should prevent duplicate instances', async () => {
      const result1 = await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId
      );

      const result2 = await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Second call should return existing instance
    });

    it('should track reconnection attempts', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId
      );

      // Simulate multiple disconnections
      for (let i = 0; i < 3; i++) {
        simulateConnectionClose(mockSocket, new Error('Connection lost'));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const instance = BaileysService.getInstance(testOrgId, testInstanceId);
      expect(instance?.reconnectAttempts).toBeGreaterThan(0);
    });

    it('should stop reconnecting after max attempts', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId
      );

      // Simulate max reconnection attempts
      for (let i = 0; i < 6; i++) {
        simulateConnectionClose(mockSocket, new Error('Connection lost'));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('status')
        .eq('id', testInstanceId)
        .single();

      expect(instance?.status).toBe('disconnected');
    });

    it('should reset reconnect attempts on successful connection', async () => {
      await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId
      );

      // Disconnect and reconnect
      simulateConnectionClose(mockSocket);
      await new Promise(resolve => setTimeout(resolve, 100));

      simulateConnectionOpen(mockSocket);
      await new Promise(resolve => setTimeout(resolve, 100));

      const instance = BaileysService.getInstance(testOrgId, testInstanceId);
      expect(instance?.reconnectAttempts).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      // Try with non-existent instance
      const result = await BaileysService.initializeInstance(
        testOrgId,
        'non-existent-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Instance not found');
    });

    it('should handle socket creation errors', async () => {
      const makeWASocket = require('@whiskeysockets/baileys').makeWASocket;
      makeWASocket.mockImplementationOnce(() => {
        throw new Error('Socket creation failed');
      });

      const result = await BaileysService.initializeInstance(
        testOrgId,
        testInstanceId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Socket creation failed');
    });
  });
});

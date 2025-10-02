/**
 * Baileys Test Mocks and Helpers
 * Provides mock data and utilities for testing WhatsApp functionality
 */

import { WASocket, proto, BinaryNode } from '@whiskeysockets/baileys';
import { EventEmitter } from 'events';

/**
 * Creates a mock Baileys message
 */
export function createMockBaileysMessage(overrides?: Partial<proto.IWebMessageInfo>): proto.IWebMessageInfo {
  const timestamp = Date.now();
  const messageId = `TEST_MSG_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    key: {
      remoteJid: '5511999999999@s.whatsapp.net',
      fromMe: false,
      id: messageId,
      ...(overrides?.key || {}),
    },
    messageTimestamp: Math.floor(timestamp / 1000),
    pushName: 'Test User',
    message: {
      conversation: 'Test message content',
      ...(overrides?.message || {}),
    },
    ...overrides,
  };
}

/**
 * Creates a mock Baileys message from owner
 */
export function createMockOwnerMessage(phoneNumber: string, content: string): proto.IWebMessageInfo {
  return createMockBaileysMessage({
    key: {
      remoteJid: `${phoneNumber}@s.whatsapp.net`,
      fromMe: false,
      id: `OWNER_MSG_${Date.now()}`,
    },
    message: {
      conversation: content,
    },
    pushName: 'Owner',
  });
}

/**
 * Creates a mock Baileys message from client
 */
export function createMockClientMessage(phoneNumber: string, content: string): proto.IWebMessageInfo {
  return createMockBaileysMessage({
    key: {
      remoteJid: `${phoneNumber}@s.whatsapp.net`,
      fromMe: false,
      id: `CLIENT_MSG_${Date.now()}`,
    },
    message: {
      conversation: content,
    },
    pushName: 'Client Test',
  });
}

/**
 * Creates a mock Baileys image message
 */
export function createMockImageMessage(phoneNumber: string): proto.IWebMessageInfo {
  return createMockBaileysMessage({
    key: {
      remoteJid: `${phoneNumber}@s.whatsapp.net`,
      fromMe: false,
      id: `IMAGE_MSG_${Date.now()}`,
    },
    message: {
      imageMessage: {
        url: 'https://example.com/image.jpg',
        mimetype: 'image/jpeg',
        caption: 'Test image',
        jpegThumbnail: Buffer.from('test'),
      },
    },
  });
}

/**
 * Creates a mock WASocket instance
 */
export function createMockWASocket(): Partial<WASocket> {
  const emitter = new EventEmitter();

  const mockSocket = {
    ev: emitter,
    user: {
      id: '5511999999999@s.whatsapp.net',
      name: 'Test Instance',
    },
    sendMessage: jest.fn().mockResolvedValue({
      status: 1,
      messageID: 'mock_sent_message_id',
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    end: jest.fn(),
    authState: {
      creds: {
        me: {
          id: '5511999999999@s.whatsapp.net',
          name: 'Test Instance',
        },
        registered: true,
      },
      keys: {},
    },
    requestPairingCode: jest.fn().mockResolvedValue('AB12CD34'),
    requestRegistrationCode: jest.fn().mockResolvedValue(undefined),
  };

  return mockSocket as Partial<WASocket>;
}

/**
 * Simulates connection open event
 */
export function simulateConnectionOpen(socket: Partial<WASocket>) {
  socket.ev?.emit('connection.update', {
    connection: 'open',
    isNewLogin: false,
  });
}

/**
 * Simulates connection close event
 */
export function simulateConnectionClose(socket: Partial<WASocket>, reason?: any) {
  socket.ev?.emit('connection.update', {
    connection: 'close',
    lastDisconnect: {
      error: reason || new Error('Test disconnect'),
      date: new Date(),
    },
  });
}

/**
 * Simulates QR code generation
 */
export function simulateQRCode(socket: Partial<WASocket>) {
  socket.ev?.emit('connection.update', {
    qr: 'test_qr_code_data',
  });
}

/**
 * Simulates pairing code generation
 */
export function simulatePairingCode(socket: Partial<WASocket>, code: string = 'AB12CD34') {
  socket.ev?.emit('connection.update', {
    pairingCode: code,
  });
}

/**
 * Simulates credentials update
 */
export function simulateCredsUpdate(socket: Partial<WASocket>) {
  socket.ev?.emit('creds.update', {
    me: {
      id: '5511999999999@s.whatsapp.net',
      name: 'Updated Test Instance',
    },
    registered: true,
  });
}

/**
 * Simulates message reception
 */
export function simulateMessageReceived(socket: Partial<WASocket>, message: proto.IWebMessageInfo) {
  socket.ev?.emit('messages.upsert', {
    messages: [message],
    type: 'notify',
  });
}

/**
 * Simulates message update (read/delivered)
 */
export function simulateMessageUpdate(socket: Partial<WASocket>, messageId: string, status: number) {
  socket.ev?.emit('messages.update', [
    {
      key: { id: messageId },
      update: { status },
    },
  ]);
}

/**
 * Mock session data for testing
 */
export const mockSessionData = {
  creds: {
    me: {
      id: '5511999999999@s.whatsapp.net',
      name: 'Test Instance',
    },
    registered: true,
    noiseKey: {
      private: Buffer.from('mock_noise_key_private'),
      public: Buffer.from('mock_noise_key_public'),
    },
    signedIdentityKey: {
      private: Buffer.from('mock_signed_identity_key_private'),
      public: Buffer.from('mock_signed_identity_key_public'),
    },
    signedPreKey: {
      keyPair: {
        private: Buffer.from('mock_signed_prekey_private'),
        public: Buffer.from('mock_signed_prekey_public'),
      },
      signature: Buffer.from('mock_signature'),
      keyId: 1,
    },
    registrationId: 12345,
    advSecretKey: 'mock_adv_secret_key',
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    serverHasPreKeys: true,
  },
  keys: {
    'pre-key': {},
    'session': {},
    'sender-key': {},
    'app-state-sync-key': {},
    'app-state-sync-version': {},
  },
};

/**
 * Helper to extract phone number from JID
 */
export function extractPhoneFromJid(jid: string): string {
  return jid.split('@')[0].replace(/\D/g, '');
}

/**
 * Helper to create JID from phone number
 */
export function createJidFromPhone(phoneNumber: string): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return `${cleanPhone}@s.whatsapp.net`;
}

/**
 * Delay helper for async tests
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for event with timeout
 */
export async function waitForEvent(
  emitter: EventEmitter,
  event: string,
  timeout: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeListener(event, handler);
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    const handler = (data: any) => {
      clearTimeout(timer);
      resolve(data);
    };

    emitter.once(event, handler);
  });
}

/**
 * Mock BullMQ job
 */
export function createMockJob(data: any) {
  return {
    id: `job_${Date.now()}`,
    data,
    attemptsMade: 0,
    processedOn: Date.now(),
    timestamp: Date.now(),
    updateProgress: jest.fn(),
    log: jest.fn(),
  };
}

/**
 * Mock Socket.IO instance for testing
 */
export function createMockSocketIO() {
  const emitter = new EventEmitter();

  return {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn((event: string, ...args: any[]) => {
      emitter.emit(event, ...args);
      return true;
    }),
    on: jest.fn((event: string, handler: Function) => {
      emitter.on(event, handler as any);
    }),
    off: jest.fn((event: string, handler: Function) => {
      emitter.off(event, handler as any);
    }),
    _getEmitter: () => emitter,
  };
}

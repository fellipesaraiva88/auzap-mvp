/**
 * Message Reception E2E Tests
 * Tests incoming message handling, database persistence, and conversation creation
 */

import { BaileysService } from '../src/services/baileys.service';
import { ConversationsService } from '../src/services/conversations.service';
import { ContactsService } from '../src/services/contacts.service';
import { supabase } from '../src/config/supabase';
import { io } from '../src/index';
import {
  createMockBaileysMessage,
  createMockClientMessage,
  createMockOwnerMessage,
  createMockImageMessage,
  createMockWASocket,
  simulateMessageReceived,
  waitForEvent,
  createMockSocketIO,
} from './helpers/baileys.mock';
import {
  testOrganization,
  testWhatsAppInstance,
  testPhoneNumbers,
  createTestContact,
  createTestConversation,
} from './helpers/test-data';

describe('Message Reception', () => {
  let testOrgId: string;
  let testInstanceId: string;
  let testContactId: string;
  let mockSocket: any;
  let mockSocketIO: any;

  beforeEach(async () => {
    // Setup mock socket
    mockSocket = createMockWASocket();
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
        status: 'connected',
      }])
      .select()
      .single();

    if (instanceError) throw instanceError;
    testInstanceId = instance.id;

    // Create test contact
    const contact = await ContactsService.createContact({
      organization_id: testOrgId,
      phone: testPhoneNumbers.client1,
      name: 'Test Client',
    });
    testContactId = contact.id;
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase.from('messages').delete().match({ organization_id: testOrgId });
    await supabase.from('conversations').delete().match({ organization_id: testOrgId });
    await supabase.from('contacts').delete().eq('id', testContactId);
    await supabase.from('whatsapp_instances').delete().eq('id', testInstanceId);
    await supabase.from('organizations').delete().eq('id', testOrgId);

    jest.clearAllMocks();
  });

  describe('Text Message Reception', () => {
    it('should save incoming text message to database', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Hello, I need to schedule a bath for my dog'
      );

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(error).toBeNull();
      expect(messages).toBeDefined();
      expect(messages.content).toBe('Hello, I need to schedule a bath for my dog');
      expect(messages.sender_phone).toBe(testPhoneNumbers.client1);
      expect(messages.direction).toBe('incoming');
      expect(messages.content_type).toBe('text');
    });

    it('should extract correct message content from conversation type', async () => {
      const mockMessage = createMockBaileysMessage({
        message: {
          conversation: 'Simple text message',
        },
      });

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage?.content).toBe('Simple text message');
    });

    it('should extract content from extendedTextMessage', async () => {
      const mockMessage = createMockBaileysMessage({
        message: {
          extendedTextMessage: {
            text: 'Extended text with formatting',
          },
        },
      });

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage?.content).toBe('Extended text with formatting');
    });

    it('should store message metadata correctly', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('metadata')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage?.metadata).toBeDefined();
      expect(savedMessage?.metadata.message_type).toBeDefined();
      expect(savedMessage?.metadata.timestamp).toBeDefined();
    });
  });

  describe('Media Message Reception', () => {
    it('should handle image messages', async () => {
      const mockMessage = createMockImageMessage(testPhoneNumbers.client1);

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage).toBeDefined();
      expect(savedMessage.content_type).toBe('image');
      expect(savedMessage.content).toContain('Imagem');
    });

    it('should store image caption if provided', async () => {
      const mockMessage = createMockBaileysMessage({
        message: {
          imageMessage: {
            url: 'https://example.com/image.jpg',
            caption: 'Look at this photo',
            mimetype: 'image/jpeg',
          },
        },
      });

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage?.content).toBe('Look at this photo');
    });

    it('should handle audio messages', async () => {
      const mockMessage = createMockBaileysMessage({
        message: {
          audioMessage: {
            url: 'https://example.com/audio.ogg',
            mimetype: 'audio/ogg',
          },
        },
      });

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage?.content_type).toBe('audio');
      expect(savedMessage?.content).toContain('Áudio');
    });

    it('should handle video messages', async () => {
      const mockMessage = createMockBaileysMessage({
        message: {
          videoMessage: {
            url: 'https://example.com/video.mp4',
            caption: 'Check this out',
            mimetype: 'video/mp4',
          },
        },
      });

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage?.content_type).toBe('video');
      expect(savedMessage?.content).toBe('Check this out');
    });

    it('should handle document messages', async () => {
      const mockMessage = createMockBaileysMessage({
        message: {
          documentMessage: {
            url: 'https://example.com/document.pdf',
            fileName: 'invoice.pdf',
            mimetype: 'application/pdf',
          },
        },
      });

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: savedMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_message_id', mockMessage.key.id)
        .single();

      expect(savedMessage?.content_type).toBe('document');
      expect(savedMessage?.content).toBe('invoice.pdf');
    });
  });

  describe('Conversation Creation', () => {
    it('should create conversation if not exists', async () => {
      const newPhone = testPhoneNumbers.client2;
      const mockMessage = createMockClientMessage(newPhone, 'First message');

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', testOrgId)
        .eq('contact_phone', newPhone);

      expect(error).toBeNull();
      expect(conversations).toBeDefined();
      expect(conversations.length).toBe(1);
      expect(conversations[0].last_message).toBe('First message');
    });

    it('should reuse existing conversation', async () => {
      // Create existing conversation
      const conversation = await ConversationsService.findOrCreateConversation(
        testOrgId,
        testContactId,
        testInstanceId
      );

      const mockMessage1 = createMockClientMessage(testPhoneNumbers.client1, 'Message 1');
      const mockMessage2 = createMockClientMessage(testPhoneNumbers.client1, 'Message 2');

      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage1);
      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage2);

      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', testOrgId)
        .eq('id', conversation.id);

      expect(conversations?.length).toBe(1); // Should not create duplicate
    });

    it('should update conversation last message', async () => {
      const conversation = await ConversationsService.findOrCreateConversation(
        testOrgId,
        testContactId,
        testInstanceId
      );

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Latest message'
      );

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const { data: updatedConversation } = await supabase
        .from('conversations')
        .select('last_message, last_message_at')
        .eq('id', conversation.id)
        .single();

      expect(updatedConversation?.last_message).toBe('Latest message');
      expect(updatedConversation?.last_message_at).toBeDefined();
    });

    it('should increment unread count', async () => {
      const conversation = await ConversationsService.findOrCreateConversation(
        testOrgId,
        testContactId,
        testInstanceId
      );

      const mockMessage1 = createMockClientMessage(testPhoneNumbers.client1, 'Message 1');
      const mockMessage2 = createMockClientMessage(testPhoneNumbers.client1, 'Message 2');

      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage1);
      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage2);

      const { data: updatedConversation } = await supabase
        .from('conversations')
        .select('unread_count')
        .eq('id', conversation.id)
        .single();

      expect(updatedConversation?.unread_count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Contact Management', () => {
    it('should create contact if not exists', async () => {
      const newPhone = testPhoneNumbers.client3;
      const mockMessage = createMockClientMessage(newPhone, 'Hello');

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const contact = await ContactsService.getContactByPhone(testOrgId, newPhone);

      expect(contact).toBeDefined();
      expect(contact?.phone).toBe(newPhone);
    });

    it('should reuse existing contact', async () => {
      const mockMessage1 = createMockClientMessage(testPhoneNumbers.client1, 'Message 1');
      const mockMessage2 = createMockClientMessage(testPhoneNumbers.client1, 'Message 2');

      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage1);
      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage2);

      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', testOrgId)
        .eq('phone', testPhoneNumbers.client1);

      expect(contacts?.length).toBe(1); // Should not create duplicate
    });

    it('should set initial contact name as phone number', async () => {
      const newPhone = testPhoneNumbers.client2;
      const mockMessage = createMockClientMessage(newPhone, 'Hello');

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const contact = await ContactsService.getContactByPhone(testOrgId, newPhone);

      expect(contact?.name).toBe(newPhone); // Initially set to phone number
    });
  });

  describe('Socket.IO Event Emission', () => {
    it('should emit message event to frontend', async () => {
      const emitter = mockSocketIO._getEmitter();
      const messagePromise = waitForEvent(emitter, 'whatsapp:message');

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const eventData = await messagePromise;

      expect(eventData).toBeDefined();
      expect(eventData.message).toBeDefined();
      expect(eventData.message.content).toBe('Test message');
      expect(eventData.message.direction).toBe('incoming');
    });

    it('should emit to correct organization room', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockSocketIO.to).toHaveBeenCalledWith(`org-${testOrgId}`);
    });

    it('should include conversation and contact IDs in event', async () => {
      const emitter = mockSocketIO._getEmitter();
      const messagePromise = waitForEvent(emitter, 'whatsapp:message');

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await BaileysService.handleIncomingMessage(
        testOrgId,
        testInstanceId,
        mockMessage
      );

      const eventData = await messagePromise;

      expect(eventData.conversationId).toBeDefined();
      expect(eventData.contactId).toBeDefined();
      expect(eventData.contactId).toBe(testContactId);
    });
  });

  describe('Error Handling', () => {
    it('should handle messages without content gracefully', async () => {
      const mockMessage = createMockBaileysMessage({
        message: {}, // Empty message
      });

      await expect(
        BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage)
      ).resolves.not.toThrow();

      // Should not save message without content
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_message_id', mockMessage.key.id);

      expect(messages?.length).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Test with invalid organization ID
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await expect(
        BaileysService.handleIncomingMessage('invalid-org-id', testInstanceId, mockMessage)
      ).rejects.toThrow();
    });

    it('should log errors appropriately', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      try {
        await BaileysService.handleIncomingMessage('invalid-org', testInstanceId, mockMessage);
      } catch (error) {
        // Expected to throw
      }

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Message Deduplication', () => {
    it('should prevent duplicate message saves', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Duplicate test'
      );

      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage);
      await BaileysService.handleIncomingMessage(testOrgId, testInstanceId, mockMessage);

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_message_id', mockMessage.key.id);

      expect(messages?.length).toBe(1); // Should only save once
    });
  });
});

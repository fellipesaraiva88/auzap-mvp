/**
 * Message Routing E2E Tests
 * Tests owner detection, message routing to Aurora vs Client AI
 */

import { supabase } from '../src/config/supabase';
import { BaileysService } from '../src/services/baileys.service';
import { ClientAIService } from '../src/services/client-ai.service';
import { AuroraService } from '../src/services/aurora.service';
import { ContactsService } from '../src/services/contacts.service';
import {
  createMockClientMessage,
  createMockOwnerMessage,
  createMockWASocket,
  extractPhoneFromJid,
} from './helpers/baileys.mock';
import {
  testOrganization,
  testWhatsAppInstance,
  testPhoneNumbers,
  auroraTestMessages,
  clientTestMessages,
  createTestContact,
} from './helpers/test-data';

// Mock services
jest.mock('../src/services/client-ai.service');
jest.mock('../src/services/aurora.service');

/**
 * Owner Detection Service
 * Determines if a phone number belongs to organization owner
 */
class OwnerDetectionService {
  static async isOwner(organizationId: string, phoneNumber: string): Promise<boolean> {
    try {
      // Clean phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');

      // Check if phone matches organization owner phone
      const { data: org, error } = await supabase
        .from('organizations')
        .select('phone')
        .eq('id', organizationId)
        .single();

      if (error || !org) {
        return false;
      }

      const orgPhone = org.phone.replace(/\D/g, '');
      return cleanPhone === orgPhone;
    } catch (error) {
      console.error('[OWNER_DETECTION] Error:', error);
      return false;
    }
  }

  static async detectFromMessage(message: any, organizationId: string): Promise<boolean> {
    const from = message.key.remoteJid;
    const phoneNumber = extractPhoneFromJid(from);
    return this.isOwner(organizationId, phoneNumber);
  }
}

/**
 * Message Router Service
 * Routes messages to appropriate AI service based on sender
 */
class MessageRouterService {
  static async routeMessage(
    organizationId: string,
    instanceId: string,
    message: any,
    conversationId: string
  ): Promise<{ service: 'aurora' | 'client-ai'; response: string }> {
    const isOwner = await OwnerDetectionService.detectFromMessage(message, organizationId);

    const content = message.message?.conversation ||
                    message.message?.extendedTextMessage?.text || '';

    if (isOwner) {
      // Route to Aurora
      const result = await AuroraService.handleOwnerMessage({
        organizationId,
        message: content,
        conversationId,
      });

      return {
        service: 'aurora',
        response: result.response,
      };
    } else {
      // Route to Client AI
      const result = await ClientAIService.generateResponse({
        organizationId,
        conversationId,
        message: content,
      });

      return {
        service: 'client-ai',
        response: result.response,
      };
    }
  }
}

describe('Message Routing', () => {
  let testOrgId: string;
  let testInstanceId: string;
  let testContactId: string;
  let testConversationId: string;
  let mockSocket: any;

  beforeEach(async () => {
    // Setup mock socket
    mockSocket = createMockWASocket();

    // Create test organization with owner phone
    const { data: org } = await supabase
      .from('organizations')
      .insert([{
        ...testOrganization,
        phone: testPhoneNumbers.owner, // Set owner phone
      }])
      .select()
      .single();
    testOrgId = org!.id;

    // Create test instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .insert([{
        ...testWhatsAppInstance,
        organization_id: testOrgId,
        phone_number: testPhoneNumbers.owner,
        status: 'connected',
      }])
      .select()
      .single();
    testInstanceId = instance!.id;

    // Create test contact
    const contact = await supabase
      .from('contacts')
      .insert([{
        organization_id: testOrgId,
        phone: testPhoneNumbers.client1,
        name: 'Test Client',
      }])
      .select()
      .single();
    testContactId = contact.data!.id;

    // Create test conversation
    const conversation = await supabase
      .from('conversations')
      .insert([{
        organization_id: testOrgId,
        whatsapp_instance_id: testInstanceId,
        contact_id: testContactId,
        contact_phone: testPhoneNumbers.client1,
        contact_name: 'Test Client',
        last_message: 'Test',
        status: 'active',
      }])
      .select()
      .single();
    testConversationId = conversation.data!.id;

    // Mock AI responses
    (ClientAIService.generateResponse as jest.Mock).mockResolvedValue({
      response: 'Client AI response',
      intent: 'general',
      confidence: 0.9,
    });

    (AuroraService.handleOwnerMessage as jest.Mock).mockResolvedValue({
      response: 'Aurora response',
      action: 'list_services',
    });
  });

  afterEach(async () => {
    // Cleanup
    await supabase.from('conversations').delete().eq('id', testConversationId);
    await supabase.from('contacts').delete().eq('id', testContactId);
    await supabase.from('whatsapp_instances').delete().eq('id', testInstanceId);
    await supabase.from('organizations').delete().eq('id', testOrgId);

    jest.clearAllMocks();
  });

  describe('Owner Detection', () => {
    it('should detect owner number correctly', async () => {
      const isOwner = await OwnerDetectionService.isOwner(
        testOrgId,
        testPhoneNumbers.owner
      );

      expect(isOwner).toBe(true);
    });

    it('should detect non-owner number correctly', async () => {
      const isOwner = await OwnerDetectionService.isOwner(
        testOrgId,
        testPhoneNumbers.client1
      );

      expect(isOwner).toBe(false);
    });

    it('should handle phone number formatting variations', async () => {
      const variations = [
        testPhoneNumbers.owner,
        testPhoneNumbers.owner.replace(/\D/g, ''),
        `+${testPhoneNumbers.owner}`,
        testPhoneNumbers.owner.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '($1) $2 $3-$4'),
      ];

      for (const variant of variations) {
        const isOwner = await OwnerDetectionService.isOwner(testOrgId, variant);
        expect(isOwner).toBe(true);
      }
    });

    it('should detect owner from message object', async () => {
      const ownerMessage = createMockOwnerMessage(
        testPhoneNumbers.owner,
        'Test message'
      );

      const isOwner = await OwnerDetectionService.detectFromMessage(
        ownerMessage,
        testOrgId
      );

      expect(isOwner).toBe(true);
    });

    it('should detect client from message object', async () => {
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      const isOwner = await OwnerDetectionService.detectFromMessage(
        clientMessage,
        testOrgId
      );

      expect(isOwner).toBe(false);
    });

    it('should handle invalid phone numbers gracefully', async () => {
      const isOwner = await OwnerDetectionService.isOwner(
        testOrgId,
        'invalid-phone'
      );

      expect(isOwner).toBe(false);
    });

    it('should handle non-existent organization gracefully', async () => {
      const isOwner = await OwnerDetectionService.isOwner(
        'non-existent-org',
        testPhoneNumbers.owner
      );

      expect(isOwner).toBe(false);
    });
  });

  describe('Aurora Routing', () => {
    it('should route owner message to Aurora', async () => {
      const ownerMessage = createMockOwnerMessage(
        testPhoneNumbers.owner,
        auroraTestMessages.listServices
      );

      const result = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        ownerMessage,
        testConversationId
      );

      expect(result.service).toBe('aurora');
      expect(AuroraService.handleOwnerMessage).toHaveBeenCalled();
      expect(ClientAIService.generateResponse).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to Aurora', async () => {
      const ownerMessage = createMockOwnerMessage(
        testPhoneNumbers.owner,
        auroraTestMessages.todayBookings
      );

      await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        ownerMessage,
        testConversationId
      );

      expect(AuroraService.handleOwnerMessage).toHaveBeenCalledWith({
        organizationId: testOrgId,
        message: auroraTestMessages.todayBookings,
        conversationId: testConversationId,
      });
    });

    it('should handle different Aurora commands', async () => {
      const commands = [
        auroraTestMessages.listServices,
        auroraTestMessages.listBookings,
        auroraTestMessages.listClients,
        auroraTestMessages.revenue,
        auroraTestMessages.stats,
      ];

      for (const command of commands) {
        jest.clearAllMocks();

        const ownerMessage = createMockOwnerMessage(testPhoneNumbers.owner, command);

        const result = await MessageRouterService.routeMessage(
          testOrgId,
          testInstanceId,
          ownerMessage,
          testConversationId
        );

        expect(result.service).toBe('aurora');
        expect(AuroraService.handleOwnerMessage).toHaveBeenCalled();
      }
    });
  });

  describe('Client AI Routing', () => {
    it('should route client message to Client AI', async () => {
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.greeting
      );

      const result = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        clientMessage,
        testConversationId
      );

      expect(result.service).toBe('client-ai');
      expect(ClientAIService.generateResponse).toHaveBeenCalled();
      expect(AuroraService.handleOwnerMessage).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to Client AI', async () => {
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.bookingInquiry
      );

      await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        clientMessage,
        testConversationId
      );

      expect(ClientAIService.generateResponse).toHaveBeenCalledWith({
        organizationId: testOrgId,
        conversationId: testConversationId,
        message: clientTestMessages.bookingInquiry,
      });
    });

    it('should handle different client message types', async () => {
      const messageTypes = [
        clientTestMessages.greeting,
        clientTestMessages.bookingInquiry,
        clientTestMessages.serviceInfo,
        clientTestMessages.cancelBooking,
        clientTestMessages.reschedule,
      ];

      for (const messageContent of messageTypes) {
        jest.clearAllMocks();

        const clientMessage = createMockClientMessage(
          testPhoneNumbers.client1,
          messageContent
        );

        const result = await MessageRouterService.routeMessage(
          testOrgId,
          testInstanceId,
          clientMessage,
          testConversationId
        );

        expect(result.service).toBe('client-ai');
        expect(ClientAIService.generateResponse).toHaveBeenCalled();
      }
    });
  });

  describe('Multi-Client Routing', () => {
    it('should route different clients correctly', async () => {
      const client1Message = createMockClientMessage(
        testPhoneNumbers.client1,
        'Client 1 message'
      );
      const client2Message = createMockClientMessage(
        testPhoneNumbers.client2,
        'Client 2 message'
      );
      const client3Message = createMockClientMessage(
        testPhoneNumbers.client3,
        'Client 3 message'
      );

      const results = await Promise.all([
        MessageRouterService.routeMessage(testOrgId, testInstanceId, client1Message, testConversationId),
        MessageRouterService.routeMessage(testOrgId, testInstanceId, client2Message, testConversationId),
        MessageRouterService.routeMessage(testOrgId, testInstanceId, client3Message, testConversationId),
      ]);

      results.forEach(result => {
        expect(result.service).toBe('client-ai');
      });

      expect(ClientAIService.generateResponse).toHaveBeenCalledTimes(3);
    });

    it('should not confuse clients with owner', async () => {
      const ownerMessage = createMockOwnerMessage(
        testPhoneNumbers.owner,
        auroraTestMessages.stats
      );
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.greeting
      );

      const ownerResult = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        ownerMessage,
        testConversationId
      );

      jest.clearAllMocks();

      const clientResult = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        clientMessage,
        testConversationId
      );

      expect(ownerResult.service).toBe('aurora');
      expect(clientResult.service).toBe('client-ai');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message content', async () => {
      const emptyMessage = createMockClientMessage(testPhoneNumbers.client1, '');

      const result = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        emptyMessage,
        testConversationId
      );

      expect(result).toBeDefined();
      expect(result.service).toBe('client-ai');
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        longMessage
      );

      const result = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        clientMessage,
        testConversationId
      );

      expect(result).toBeDefined();
      expect(ClientAIService.generateResponse).toHaveBeenCalled();
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        specialMessage
      );

      const result = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        clientMessage,
        testConversationId
      );

      expect(result).toBeDefined();
    });

    it('should handle emojis in messages', async () => {
      const emojiMessage = '👋 Olá! 🐕 Preciso agendar um banho 🛁';
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        emojiMessage
      );

      const result = await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        clientMessage,
        testConversationId
      );

      expect(result).toBeDefined();
      expect(ClientAIService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: emojiMessage,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Aurora service failures', async () => {
      (AuroraService.handleOwnerMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Aurora service unavailable')
      );

      const ownerMessage = createMockOwnerMessage(
        testPhoneNumbers.owner,
        auroraTestMessages.listServices
      );

      await expect(
        MessageRouterService.routeMessage(
          testOrgId,
          testInstanceId,
          ownerMessage,
          testConversationId
        )
      ).rejects.toThrow('Aurora service unavailable');
    });

    it('should handle Client AI service failures', async () => {
      (ClientAIService.generateResponse as jest.Mock).mockRejectedValueOnce(
        new Error('Client AI service unavailable')
      );

      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.greeting
      );

      await expect(
        MessageRouterService.routeMessage(
          testOrgId,
          testInstanceId,
          clientMessage,
          testConversationId
        )
      ).rejects.toThrow('Client AI service unavailable');
    });

    it('should handle database connection errors during owner detection', async () => {
      // Force database error by using invalid org ID
      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      const result = await MessageRouterService.routeMessage(
        'invalid-org-id',
        testInstanceId,
        clientMessage,
        testConversationId
      );

      // Should default to client-ai when owner detection fails
      expect(result.service).toBe('client-ai');
    });
  });

  describe('Performance', () => {
    it('should route messages quickly', async () => {
      const startTime = Date.now();

      const clientMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.greeting
      );

      await MessageRouterService.routeMessage(
        testOrgId,
        testInstanceId,
        clientMessage,
        testConversationId
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should route in under 1 second
    });

    it('should handle concurrent routing requests', async () => {
      const messages = [
        createMockOwnerMessage(testPhoneNumbers.owner, auroraTestMessages.stats),
        createMockClientMessage(testPhoneNumbers.client1, clientTestMessages.greeting),
        createMockClientMessage(testPhoneNumbers.client2, clientTestMessages.bookingInquiry),
      ];

      const results = await Promise.all(
        messages.map(msg =>
          MessageRouterService.routeMessage(testOrgId, testInstanceId, msg, testConversationId)
        )
      );

      expect(results).toHaveLength(3);
      expect(results[0].service).toBe('aurora');
      expect(results[1].service).toBe('client-ai');
      expect(results[2].service).toBe('client-ai');
    });
  });
});

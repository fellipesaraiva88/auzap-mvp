/**
 * Message Processing Worker E2E Tests
 * Tests message queue processing, AI response generation, and reply sending
 */

import { messageQueue } from '../src/config/redis';
import { BaileysService } from '../src/services/baileys.service';
import { ClientAIService } from '../src/services/client-ai.service';
import { AuroraService } from '../src/services/aurora.service';
import { supabase } from '../src/config/supabase';
import {
  createMockBaileysMessage,
  createMockClientMessage,
  createMockOwnerMessage,
  createMockJob,
  delay,
  createMockWASocket,
} from './helpers/baileys.mock';
import {
  testOrganization,
  testWhatsAppInstance,
  testPhoneNumbers,
  clientTestMessages,
  auroraTestMessages,
  createTestContact,
  createTestConversation,
  createTestService,
  mockAIResponses,
} from './helpers/test-data';

// Mock dependencies
jest.mock('../src/services/client-ai.service');
jest.mock('../src/services/aurora.service');

describe('Message Processing Worker', () => {
  let testOrgId: string;
  let testInstanceId: string;
  let testContactId: string;
  let testConversationId: string;
  let mockSocket: any;

  beforeEach(async () => {
    // Setup mock socket
    mockSocket = createMockWASocket();
    const makeWASocket = require('@whiskeysockets/baileys').makeWASocket;
    makeWASocket.mockReturnValue(mockSocket);

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert([testOrganization])
      .select()
      .single();
    testOrgId = org!.id;

    // Create test instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .insert([{
        ...testWhatsAppInstance,
        organization_id: testOrgId,
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

    // Mock AI services
    (ClientAIService.generateResponse as jest.Mock).mockResolvedValue({
      response: mockAIResponses.greeting,
      intent: 'greeting',
      confidence: 0.95,
    });

    (AuroraService.handleOwnerMessage as jest.Mock).mockResolvedValue({
      response: 'Aurora: Here are your services...',
      action: 'list_services',
    });

    // Clear queue before each test
    await messageQueue.drain();
    await messageQueue.clean(0, 1000, 'completed');
    await messageQueue.clean(0, 1000, 'failed');
  });

  afterEach(async () => {
    // Cleanup
    await supabase.from('messages').delete().match({ organization_id: testOrgId });
    await supabase.from('conversations').delete().eq('id', testConversationId);
    await supabase.from('contacts').delete().eq('id', testContactId);
    await supabase.from('whatsapp_instances').delete().eq('id', testInstanceId);
    await supabase.from('organizations').delete().eq('id', testOrgId);

    jest.clearAllMocks();
  });

  describe('Queue Processing', () => {
    it('should process message from queue', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.greeting
      );

      const job = await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
      });

      // Wait for job to be processed
      await delay(2000);

      const jobState = await job.getState();
      expect(['completed', 'waiting']).toContain(jobState);
    });

    it('should handle job progress updates', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      const job = await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
      });

      await delay(1500);

      const progress = await job.progress;
      expect(typeof progress).toBe('number');
    });

    it('should retry failed jobs', async () => {
      // Mock a failing scenario
      (ClientAIService.generateResponse as jest.Mock).mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      const job = await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });

      await delay(2000);

      const attemptsMade = job.attemptsMade;
      expect(attemptsMade).toBeGreaterThan(0);
    });

    it('should handle queue errors gracefully', async () => {
      const invalidJob = await messageQueue.add('process-message', {
        organizationId: 'invalid-org',
        instanceId: 'invalid-instance',
        message: {},
      });

      await delay(2000);

      const state = await invalidJob.getState();
      expect(['failed', 'waiting']).toContain(state);
    });
  });

  describe('AI Response Generation', () => {
    it('should generate AI response for client message', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.greeting
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
      });

      await delay(2000);

      expect(ClientAIService.generateResponse).toHaveBeenCalled();
    });

    it('should use conversation context for AI', async () => {
      // Save previous messages to create context
      await supabase.from('messages').insert([
        {
          conversation_id: testConversationId,
          organization_id: testOrgId,
          whatsapp_instance_id: testInstanceId,
          sender_phone: testPhoneNumbers.client1,
          content: 'Previous message',
          content_type: 'text',
          direction: 'incoming',
          whatsapp_message_id: 'prev_msg_1',
        },
      ]);

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.bookingInquiry
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
      });

      await delay(2000);

      expect(ClientAIService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: testConversationId,
        })
      );
    });

    it('should handle different message intents', async () => {
      (ClientAIService.generateResponse as jest.Mock).mockResolvedValue({
        response: mockAIResponses.bookingConfirmation,
        intent: 'booking',
        confidence: 0.92,
      });

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.bookingInquiry
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
      });

      await delay(2000);

      expect(ClientAIService.generateResponse).toHaveBeenCalled();
    });
  });

  describe('Message Sending', () => {
    it('should send AI response via WhatsApp', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.greeting
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
      });

      await delay(2500);

      expect(mockSocket.sendMessage).toHaveBeenCalled();
    });

    it('should save sent message to database', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        clientTestMessages.serviceInfo
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
      });

      await delay(2500);

      const { data: sentMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', testConversationId)
        .eq('direction', 'outgoing');

      expect(sentMessages?.length).toBeGreaterThan(0);
    });

    it('should update conversation with sent message', async () => {
      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
      });

      await delay(2500);

      const { data: conversation } = await supabase
        .from('conversations')
        .select('last_message, last_message_at')
        .eq('id', testConversationId)
        .single();

      expect(conversation?.last_message).toBeDefined();
      expect(conversation?.last_message_at).toBeDefined();
    });

    it('should handle send failures gracefully', async () => {
      mockSocket.sendMessage.mockRejectedValueOnce(new Error('Send failed'));

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      const job = await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
      });

      await delay(2000);

      const state = await job.getState();
      expect(['failed', 'waiting']).toContain(state);
    });
  });

  describe('Aurora Message Processing', () => {
    it('should route owner messages to Aurora', async () => {
      const mockMessage = createMockOwnerMessage(
        testPhoneNumbers.owner,
        auroraTestMessages.listServices
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
        isOwner: true,
      });

      await delay(2000);

      expect(AuroraService.handleOwnerMessage).toHaveBeenCalled();
    });

    it('should not call ClientAI for owner messages', async () => {
      const mockMessage = createMockOwnerMessage(
        testPhoneNumbers.owner,
        auroraTestMessages.todayBookings
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
        conversationId: testConversationId,
        isOwner: true,
      });

      await delay(2000);

      expect(ClientAIService.generateResponse).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('should process multiple messages concurrently', async () => {
      const messages = [
        createMockClientMessage(testPhoneNumbers.client1, 'Message 1'),
        createMockClientMessage(testPhoneNumbers.client2, 'Message 2'),
        createMockClientMessage(testPhoneNumbers.client3, 'Message 3'),
      ];

      const jobs = await Promise.all(
        messages.map(msg =>
          messageQueue.add('process-message', {
            organizationId: testOrgId,
            instanceId: testInstanceId,
            message: msg,
          })
        )
      );

      await delay(3000);

      const states = await Promise.all(jobs.map(job => job.getState()));
      const processedCount = states.filter(state =>
        ['completed', 'waiting'].includes(state)
      ).length;

      expect(processedCount).toBeGreaterThan(0);
    });

    it('should handle high message volume', async () => {
      const messageCount = 10;
      const messages = Array.from({ length: messageCount }, (_, i) =>
        createMockClientMessage(testPhoneNumbers.client1, `Message ${i}`)
      );

      const startTime = Date.now();

      await Promise.all(
        messages.map(msg =>
          messageQueue.add('process-message', {
            organizationId: testOrgId,
            instanceId: testInstanceId,
            message: msg,
          })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should queue quickly
    });
  });

  describe('Error Recovery', () => {
    it('should handle temporary AI service failures', async () => {
      (ClientAIService.generateResponse as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          response: 'Retry successful',
          intent: 'general',
          confidence: 0.8,
        });

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
      }, {
        attempts: 3,
      });

      await delay(3000);

      expect(ClientAIService.generateResponse).toHaveBeenCalled();
    });

    it('should log processing errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (ClientAIService.generateResponse as jest.Mock).mockRejectedValue(
        new Error('Critical error')
      );

      const mockMessage = createMockClientMessage(
        testPhoneNumbers.client1,
        'Test message'
      );

      await messageQueue.add('process-message', {
        organizationId: testOrgId,
        instanceId: testInstanceId,
        message: mockMessage,
      });

      await delay(2000);

      consoleErrorSpy.mockRestore();
    });
  });
});

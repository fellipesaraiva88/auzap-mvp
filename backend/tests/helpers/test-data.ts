/**
 * Test Data Factory
 * Provides realistic test data for E2E tests
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Test organization data
 */
export const testOrganization = {
  id: uuidv4(),
  name: 'Test Pet Shop',
  cnpj: '12345678000190',
  phone: '5511999999999',
  email: 'test@petshop.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Test WhatsApp instance data
 */
export const testWhatsAppInstance = {
  id: uuidv4(),
  organization_id: testOrganization.id,
  instance_name: 'Test Instance',
  phone_number: '5511999999999',
  status: 'disconnected',
  pairing_code: null,
  qr_code: null,
  session_data: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Test conversation data
 */
export function createTestConversation(overrides?: any) {
  return {
    id: uuidv4(),
    organization_id: testOrganization.id,
    whatsapp_instance_id: testWhatsAppInstance.id,
    contact_phone: '5511888888888',
    contact_name: 'Test Client',
    last_message: 'Hello, this is a test',
    last_message_at: new Date().toISOString(),
    unread_count: 0,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test message data
 */
export function createTestMessage(overrides?: any) {
  return {
    id: uuidv4(),
    conversation_id: uuidv4(),
    organization_id: testOrganization.id,
    whatsapp_instance_id: testWhatsAppInstance.id,
    whatsapp_message_id: `TEST_MSG_${Date.now()}`,
    sender_phone: '5511888888888',
    sender_name: 'Test Client',
    content: 'Test message content',
    message_type: 'text',
    direction: 'incoming',
    status: 'received',
    media_url: null,
    metadata: {},
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test contact data
 */
export function createTestContact(overrides?: any) {
  return {
    id: uuidv4(),
    organization_id: testOrganization.id,
    name: 'Test Client',
    phone: '5511888888888',
    email: 'testclient@example.com',
    notes: 'Test contact notes',
    tags: ['test', 'client'],
    custom_fields: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test pet data
 */
export function createTestPet(contactId: string, overrides?: any) {
  return {
    id: uuidv4(),
    organization_id: testOrganization.id,
    contact_id: contactId,
    name: 'Rex',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 30,
    medical_info: 'Healthy dog',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test service data
 */
export function createTestService(overrides?: any) {
  return {
    id: uuidv4(),
    organization_id: testOrganization.id,
    name: 'Bath & Grooming',
    description: 'Complete bath and grooming service',
    duration_minutes: 60,
    price: 80.0,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test booking data
 */
export function createTestBooking(contactId: string, petId: string, serviceId: string, overrides?: any) {
  return {
    id: uuidv4(),
    organization_id: testOrganization.id,
    contact_id: contactId,
    pet_id: petId,
    service_id: serviceId,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    status: 'scheduled',
    notes: 'Test booking',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test Aurora message patterns (owner messages)
 */
export const auroraTestMessages = {
  listServices: 'listar serviços',
  listBookings: 'listar agendamentos',
  listClients: 'listar clientes',
  todayBookings: 'agendamentos de hoje',
  revenue: 'faturamento do mês',
  stats: 'estatísticas',
};

/**
 * Test Client AI message patterns
 */
export const clientTestMessages = {
  greeting: 'Olá, gostaria de agendar um banho para meu cachorro',
  bookingInquiry: 'Quais horários disponíveis para amanhã?',
  serviceInfo: 'Quanto custa o banho?',
  cancelBooking: 'Preciso cancelar meu agendamento',
  reschedule: 'Posso remarcar para outro dia?',
};

/**
 * Test phone numbers
 */
export const testPhoneNumbers = {
  owner: '5511999999999',
  client1: '5511888888888',
  client2: '5511777777777',
  client3: '5511666666666',
  invalid: '1234567890',
};

/**
 * Test organization IDs for different scenarios
 */
export const testOrgIds = {
  active: testOrganization.id,
  inactive: uuidv4(),
  suspended: uuidv4(),
};

/**
 * Test instance IDs for different scenarios
 */
export const testInstanceIds = {
  connected: uuidv4(),
  disconnected: uuidv4(),
  connecting: uuidv4(),
};

/**
 * Expected AI responses (for mocking OpenAI)
 */
export const mockAIResponses = {
  greeting: 'Olá! Seja bem-vindo ao nosso pet shop. Como posso ajudá-lo hoje?',
  bookingConfirmation: 'Perfeito! Agendei o banho para amanhã às 14h. Confirma?',
  serviceInfo: 'Nosso serviço de banho custa R$ 80,00 e inclui tosa higiênica.',
  unavailable: 'Desculpe, no momento não temos horários disponíveis para esse dia.',
};

/**
 * Test AI context data
 */
export function createTestAIContext(conversationId: string) {
  return {
    conversation_id: conversationId,
    organization_id: testOrganization.id,
    contact_phone: testPhoneNumbers.client1,
    recent_messages: [
      { role: 'user', content: 'Olá' },
      { role: 'assistant', content: mockAIResponses.greeting },
    ],
    available_services: [
      { name: 'Banho', price: 80 },
      { name: 'Tosa', price: 100 },
    ],
    pets: [
      { name: 'Rex', species: 'dog' },
    ],
    last_interaction: new Date().toISOString(),
  };
}

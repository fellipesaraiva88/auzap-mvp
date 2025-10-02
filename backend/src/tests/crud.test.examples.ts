/**
 * EXEMPLOS DE TESTES PARA CRUD
 *
 * Para rodar testes:
 * 1. Instalar dependências: npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
 * 2. Configurar jest.config.js
 * 3. Executar: npm test
 *
 * Este arquivo contém exemplos de como testar cada endpoint CRUD
 */

import request from 'supertest';

// Configuração base para testes
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_ORG_ID = process.env.TEST_ORG_ID || '123e4567-e89b-12d3-a456-426614174000';

describe('CRUD API Tests', () => {

  // ========== CONTACTS ==========

  describe('Contacts CRUD', () => {
    let contactId: string;

    it('POST /api/contacts - Criar contato', async () => {
      const response = await request(API_URL)
        .post('/api/contacts')
        .send({
          organization_id: TEST_ORG_ID,
          phone: '5511999999999',
          name: 'João Silva Teste',
          email: 'teste@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('João Silva Teste');
      expect(response.body.status).toBe('active');

      contactId = response.body.id;
    });

    it('GET /api/contacts - Listar contatos', async () => {
      const response = await request(API_URL)
        .get('/api/contacts')
        .query({
          organization_id: TEST_ORG_ID,
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contacts');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.contacts)).toBe(true);
    });

    it('GET /api/contacts/:id - Buscar contato por ID', async () => {
      const response = await request(API_URL)
        .get(`/api/contacts/${contactId}`)
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(contactId);
      expect(response.body).toHaveProperty('pets');
    });

    it('GET /api/contacts - Buscar com filtro', async () => {
      const response = await request(API_URL)
        .get('/api/contacts')
        .query({
          organization_id: TEST_ORG_ID,
          search: 'João',
          status: 'active',
        });

      expect(response.status).toBe(200);
      expect(response.body.contacts.length).toBeGreaterThan(0);
    });

    it('PUT /api/contacts/:id - Atualizar contato', async () => {
      const response = await request(API_URL)
        .put(`/api/contacts/${contactId}`)
        .send({
          organization_id: TEST_ORG_ID,
          name: 'João Silva Atualizado',
          email: 'novo@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('João Silva Atualizado');
    });

    it('DELETE /api/contacts/:id - Deletar contato (soft delete)', async () => {
      const response = await request(API_URL)
        .delete(`/api/contacts/${contactId}`)
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('POST /api/contacts - Validação: falha sem phone', async () => {
      const response = await request(API_URL)
        .post('/api/contacts')
        .send({
          organization_id: TEST_ORG_ID,
          name: 'Sem Telefone',
        });

      expect(response.status).toBe(400);
    });
  });

  // ========== PETS ==========

  describe('Pets CRUD', () => {
    let petId: string;
    const testContactId = 'some-contact-uuid'; // Substituir por ID real em testes

    it('POST /api/pets - Criar pet', async () => {
      const response = await request(API_URL)
        .post('/api/pets')
        .send({
          organization_id: TEST_ORG_ID,
          contact_id: testContactId,
          name: 'Rex Teste',
          species: 'dog',
          breed: 'Golden Retriever',
          age: 3,
          weight: 25.5,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Rex Teste');
      expect(response.body.is_active).toBe(true);

      petId = response.body.id;
    });

    it('GET /api/pets - Listar pets', async () => {
      const response = await request(API_URL)
        .get('/api/pets')
        .query({
          organization_id: TEST_ORG_ID,
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pets');
      expect(response.body).toHaveProperty('total');
    });

    it('GET /api/pets/:id - Buscar pet por ID', async () => {
      const response = await request(API_URL)
        .get(`/api/pets/${petId}`)
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(petId);
      expect(response.body).toHaveProperty('contact');
    });

    it('PUT /api/pets/:id - Atualizar pet', async () => {
      const response = await request(API_URL)
        .put(`/api/pets/${petId}`)
        .send({
          organization_id: TEST_ORG_ID,
          weight: 26.0,
          notes: 'Peso atualizado',
        });

      expect(response.status).toBe(200);
      expect(response.body.weight).toBe(26.0);
    });

    it('DELETE /api/pets/:id - Deletar pet', async () => {
      const response = await request(API_URL)
        .delete(`/api/pets/${petId}`)
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ========== SERVICES ==========

  describe('Services CRUD', () => {
    let serviceId: string;

    it('POST /api/services - Criar serviço', async () => {
      const response = await request(API_URL)
        .post('/api/services')
        .send({
          organization_id: TEST_ORG_ID,
          name: 'Banho e Tosa Teste',
          service_type: 'grooming',
          description: 'Serviço completo de banho e tosa',
          duration_minutes: 90,
          price: 80.00,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Banho e Tosa Teste');
      expect(response.body.is_active).toBe(true);

      serviceId = response.body.id;
    });

    it('GET /api/services - Listar serviços', async () => {
      const response = await request(API_URL)
        .get('/api/services')
        .query({
          organization_id: TEST_ORG_ID,
          is_active: true,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('total');
    });

    it('GET /api/services/:id - Buscar serviço por ID', async () => {
      const response = await request(API_URL)
        .get(`/api/services/${serviceId}`)
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(serviceId);
    });

    it('PUT /api/services/:id - Atualizar serviço', async () => {
      const response = await request(API_URL)
        .put(`/api/services/${serviceId}`)
        .send({
          organization_id: TEST_ORG_ID,
          price: 90.00,
        });

      expect(response.status).toBe(200);
      expect(response.body.price).toBe(90.00);
    });

    it('GET /api/services/analytics/popular - Serviços populares', async () => {
      const response = await request(API_URL)
        .get('/api/services/analytics/popular')
        .query({
          organization_id: TEST_ORG_ID,
          limit: 5,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('DELETE /api/services/:id - Deletar serviço', async () => {
      const response = await request(API_URL)
        .delete(`/api/services/${serviceId}`)
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ========== BOOKINGS ==========

  describe('Bookings CRUD', () => {
    let bookingId: string;
    const testContactId = 'some-contact-uuid';
    const testPetId = 'some-pet-uuid';
    const testServiceId = 'some-service-uuid';

    it('POST /api/bookings - Criar agendamento', async () => {
      const response = await request(API_URL)
        .post('/api/bookings')
        .send({
          organization_id: TEST_ORG_ID,
          contact_id: testContactId,
          pet_id: testPetId,
          service_id: testServiceId,
          scheduled_date: '2025-10-15T14:00:00Z',
          duration_minutes: 90,
          notes: 'Teste de agendamento',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('scheduled');

      bookingId = response.body.id;
    });

    it('GET /api/bookings - Listar agendamentos', async () => {
      const response = await request(API_URL)
        .get('/api/bookings')
        .query({
          organization_id: TEST_ORG_ID,
          status: 'scheduled',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bookings');
      expect(response.body).toHaveProperty('total');
    });

    it('GET /api/bookings/:id - Buscar agendamento por ID', async () => {
      const response = await request(API_URL)
        .get(`/api/bookings/${bookingId}`)
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(bookingId);
      expect(response.body).toHaveProperty('pet');
      expect(response.body).toHaveProperty('contact');
      expect(response.body).toHaveProperty('service');
    });

    it('GET /api/bookings/availability/slots - Verificar horários disponíveis', async () => {
      const response = await request(API_URL)
        .get('/api/bookings/availability/slots')
        .query({
          organization_id: TEST_ORG_ID,
          date: '2025-10-16',
          duration: 90,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('available');
    });

    it('PUT /api/bookings/:id - Atualizar agendamento', async () => {
      const response = await request(API_URL)
        .put(`/api/bookings/${bookingId}`)
        .send({
          organization_id: TEST_ORG_ID,
          status: 'confirmed',
          notes: 'Cliente confirmou',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('confirmed');
    });

    it('POST /api/bookings/:id/cancel - Cancelar agendamento', async () => {
      const response = await request(API_URL)
        .post(`/api/bookings/${bookingId}/cancel`)
        .send({
          organization_id: TEST_ORG_ID,
          reason: 'Cliente solicitou cancelamento',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('cancelled');
    });

    it('GET /api/bookings/analytics/summary - Analytics de agendamentos', async () => {
      const response = await request(API_URL)
        .get('/api/bookings/analytics/summary')
        .query({
          organization_id: TEST_ORG_ID,
          date_from: '2025-01-01',
          date_to: '2025-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('by_status');
      expect(response.body).toHaveProperty('revenue');
    });
  });

  // ========== TESTES DE VALIDAÇÃO ==========

  describe('Validation Tests', () => {

    it('Deve retornar erro 400 para organization_id inválido', async () => {
      const response = await request(API_URL)
        .get('/api/contacts')
        .query({ organization_id: 'invalid-uuid' });

      expect(response.status).toBe(400);
    });

    it('Deve retornar erro 400 para email inválido', async () => {
      const response = await request(API_URL)
        .post('/api/contacts')
        .send({
          organization_id: TEST_ORG_ID,
          phone: '5511999999999',
          email: 'email-invalido',
        });

      expect(response.status).toBe(400);
    });

    it('Deve retornar erro 404 para recurso não encontrado', async () => {
      const response = await request(API_URL)
        .get('/api/contacts/00000000-0000-0000-0000-000000000000')
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(404);
    });
  });

  // ========== TESTES DE PAGINAÇÃO ==========

  describe('Pagination Tests', () => {

    it('Deve respeitar limit e offset', async () => {
      const response = await request(API_URL)
        .get('/api/contacts')
        .query({
          organization_id: TEST_ORG_ID,
          limit: 5,
          offset: 0,
        });

      expect(response.status).toBe(200);
      expect(response.body.contacts.length).toBeLessThanOrEqual(5);
    });

    it('Deve retornar total correto', async () => {
      const response = await request(API_URL)
        .get('/api/pets')
        .query({ organization_id: TEST_ORG_ID });

      expect(response.status).toBe(200);
      expect(typeof response.body.total).toBe('number');
    });
  });
});

/**
 * SETUP DE TESTES
 *
 * Adicionar ao package.json:
 *
 * scripts:
 *   test: jest
 *   test:watch: jest --watch
 *   test:coverage: jest --coverage
 *
 * jest:
 *   preset: ts-jest
 *   testEnvironment: node
 *   testMatch: ['**\/*.test.ts']
 *   collectCoverageFrom: ['src/**\/*.ts', '!src/**\/*.test.ts']
 */

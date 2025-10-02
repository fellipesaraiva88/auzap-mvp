#!/usr/bin/env node

const https = require('https');

const BASE_URL = 'https://auzap-api.onrender.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU1NzMsImV4cCI6MjA3NDk0MTU3M30.BwvlhpRijTbdofpU06mH84-SjOWH9GFr9tzEpuN1DUM';

const results = {
  success: [],
  warnings: [],
  errors: [],
  responseTimes: {}
};

// Helper para fazer requests HTTPS
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const startTime = Date.now();

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...headers
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        let jsonBody;

        try {
          jsonBody = body ? JSON.parse(body) : {};
        } catch (e) {
          jsonBody = { raw: body };
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: jsonBody,
          responseTime
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper para validar resposta
function validateResponse(endpoint, response, expectedStatus = 200) {
  const { statusCode, responseTime } = response;

  results.responseTimes[endpoint] = responseTime;

  if (statusCode === expectedStatus) {
    if (responseTime > 500) {
      results.warnings.push({
        endpoint,
        message: `Slow response: ${responseTime}ms`,
        status: statusCode
      });
    } else {
      results.success.push({
        endpoint,
        status: statusCode,
        responseTime
      });
    }
  } else {
    results.errors.push({
      endpoint,
      expected: expectedStatus,
      received: statusCode,
      responseTime,
      body: response.body
    });
  }
}

// Testes organizados
const tests = {
  contacts: async () => {
    console.log('\n🔍 Testing CONTACTS endpoints...\n');

    // GET /api/contacts
    const list = await makeRequest('GET', '/api/contacts');
    validateResponse('GET /api/contacts', list);

    // POST /api/contacts (criar teste)
    const newContact = await makeRequest('POST', '/api/contacts', {
      name: 'Test Contact Production',
      phone: '5511999998888',
      email: 'test@production.com'
    });
    validateResponse('POST /api/contacts', newContact, 201);

    const contactId = newContact.body?.id || newContact.body?.data?.id;

    if (contactId) {
      // GET /api/contacts/:id
      const get = await makeRequest('GET', `/api/contacts/${contactId}`);
      validateResponse(`GET /api/contacts/${contactId}`, get);

      // PUT /api/contacts/:id
      const update = await makeRequest('PUT', `/api/contacts/${contactId}`, {
        name: 'Updated Test Contact'
      });
      validateResponse(`PUT /api/contacts/${contactId}`, update);

      // DELETE /api/contacts/:id
      const del = await makeRequest('DELETE', `/api/contacts/${contactId}`);
      validateResponse(`DELETE /api/contacts/${contactId}`, del, 204);
    }

    // GET /api/contacts/analytics/inactive
    const analytics = await makeRequest('GET', '/api/contacts/analytics/inactive');
    validateResponse('GET /api/contacts/analytics/inactive', analytics);
  },

  pets: async () => {
    console.log('\n🐾 Testing PETS endpoints...\n');

    // GET /api/pets
    const list = await makeRequest('GET', '/api/pets');
    validateResponse('GET /api/pets', list);

    // Precisamos de um contact_id válido
    const contacts = await makeRequest('GET', '/api/contacts');
    const contactId = contacts.body?.data?.[0]?.id || contacts.body?.[0]?.id;

    if (contactId) {
      // POST /api/pets
      const newPet = await makeRequest('POST', '/api/pets', {
        name: 'Test Pet Production',
        species: 'dog',
        breed: 'Golden Retriever',
        contact_id: contactId
      });
      validateResponse('POST /api/pets', newPet, 201);

      const petId = newPet.body?.id || newPet.body?.data?.id;

      if (petId) {
        // GET /api/pets/:id
        const get = await makeRequest('GET', `/api/pets/${petId}`);
        validateResponse(`GET /api/pets/${petId}`, get);

        // PUT /api/pets/:id
        const update = await makeRequest('PUT', `/api/pets/${petId}`, {
          name: 'Updated Test Pet'
        });
        validateResponse(`PUT /api/pets/${petId}`, update);

        // DELETE /api/pets/:id
        const del = await makeRequest('DELETE', `/api/pets/${petId}`);
        validateResponse(`DELETE /api/pets/${petId}`, del, 204);
      }
    }

    // GET /api/pets/analytics/needing-service
    const analytics = await makeRequest('GET', '/api/pets/analytics/needing-service');
    validateResponse('GET /api/pets/analytics/needing-service', analytics);
  },

  services: async () => {
    console.log('\n💼 Testing SERVICES endpoints...\n');

    // GET /api/services
    const list = await makeRequest('GET', '/api/services');
    validateResponse('GET /api/services', list);

    // POST /api/services
    const newService = await makeRequest('POST', '/api/services', {
      name: 'Test Service Production',
      description: 'Test service for production validation',
      price: 150.00,
      duration_minutes: 60
    });
    validateResponse('POST /api/services', newService, 201);

    const serviceId = newService.body?.id || newService.body?.data?.id;

    if (serviceId) {
      // GET /api/services/:id
      const get = await makeRequest('GET', `/api/services/${serviceId}`);
      validateResponse(`GET /api/services/${serviceId}`, get);

      // PUT /api/services/:id
      const update = await makeRequest('PUT', `/api/services/${serviceId}`, {
        price: 175.00
      });
      validateResponse(`PUT /api/services/${serviceId}`, update);

      // DELETE /api/services/:id
      const del = await makeRequest('DELETE', `/api/services/${serviceId}`);
      validateResponse(`DELETE /api/services/${serviceId}`, del, 204);
    }

    // GET /api/services/analytics/popular
    const popular = await makeRequest('GET', '/api/services/analytics/popular');
    validateResponse('GET /api/services/analytics/popular', popular);

    // GET /api/services/analytics/revenue
    const revenue = await makeRequest('GET', '/api/services/analytics/revenue');
    validateResponse('GET /api/services/analytics/revenue', revenue);
  },

  bookings: async () => {
    console.log('\n📅 Testing BOOKINGS endpoints...\n');

    // GET /api/bookings
    const list = await makeRequest('GET', '/api/bookings');
    validateResponse('GET /api/bookings', list);

    // Precisamos de pet_id e service_id válidos
    const pets = await makeRequest('GET', '/api/pets');
    const services = await makeRequest('GET', '/api/services');

    const petId = pets.body?.data?.[0]?.id || pets.body?.[0]?.id;
    const serviceId = services.body?.data?.[0]?.id || services.body?.[0]?.id;

    if (petId && serviceId) {
      // POST /api/bookings
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const newBooking = await makeRequest('POST', '/api/bookings', {
        pet_id: petId,
        service_id: serviceId,
        scheduled_at: tomorrow.toISOString(),
        status: 'scheduled'
      });
      validateResponse('POST /api/bookings', newBooking, 201);

      const bookingId = newBooking.body?.id || newBooking.body?.data?.id;

      if (bookingId) {
        // GET /api/bookings/:id
        const get = await makeRequest('GET', `/api/bookings/${bookingId}`);
        validateResponse(`GET /api/bookings/${bookingId}`, get);

        // PUT /api/bookings/:id
        const update = await makeRequest('PUT', `/api/bookings/${bookingId}`, {
          status: 'confirmed'
        });
        validateResponse(`PUT /api/bookings/${bookingId}`, update);

        // POST /api/bookings/:id/cancel
        const cancel = await makeRequest('POST', `/api/bookings/${bookingId}/cancel`);
        validateResponse(`POST /api/bookings/${bookingId}/cancel`, cancel);
      }
    }

    // GET /api/bookings/availability/slots
    const availability = await makeRequest('GET', '/api/bookings/availability/slots?date=2025-10-03');
    validateResponse('GET /api/bookings/availability/slots', availability);

    // GET /api/bookings/analytics/summary
    const summary = await makeRequest('GET', '/api/bookings/analytics/summary');
    validateResponse('GET /api/bookings/analytics/summary', summary);
  }
};

// Executar todos os testes
async function runTests() {
  console.log('🚀 Starting Production Endpoint Tests...');
  console.log(`📍 Base URL: ${BASE_URL}\n`);
  console.log('=' .repeat(60));

  try {
    await tests.contacts();
    await tests.pets();
    await tests.services();
    await tests.bookings();

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST RESULTS SUMMARY\n');

    // Sucessos
    console.log(`✅ SUCCESSFUL ENDPOINTS (${results.success.length}):`);
    results.success.forEach(({ endpoint, status, responseTime }) => {
      console.log(`   ${endpoint} - ${status} (${responseTime}ms)`);
    });

    // Warnings
    if (results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
      results.warnings.forEach(({ endpoint, message, status }) => {
        console.log(`   ${endpoint} - ${message} (${status})`);
      });
    }

    // Erros
    if (results.errors.length > 0) {
      console.log(`\n🐛 ERRORS (${results.errors.length}):`);
      results.errors.forEach(({ endpoint, expected, received, body }) => {
        console.log(`   ${endpoint}`);
        console.log(`      Expected: ${expected}, Received: ${received}`);
        console.log(`      Error: ${JSON.stringify(body)}`);
      });
    }

    // Performance
    console.log('\n📈 PERFORMANCE METRICS:');
    const times = Object.values(results.responseTimes);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log(`   Average: ${avgTime.toFixed(0)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);

    // Status final
    const total = results.success.length + results.warnings.length + results.errors.length;
    const successRate = ((results.success.length / total) * 100).toFixed(1);

    console.log(`\n🎯 SUCCESS RATE: ${successRate}% (${results.success.length}/${total})`);

    if (results.errors.length === 0 && results.warnings.length === 0) {
      console.log('\n✨ All endpoints are working perfectly! ✨');
    } else if (results.errors.length === 0) {
      console.log('\n✅ All endpoints are functional, but some have performance issues.');
    } else {
      console.log('\n❌ Some endpoints have critical errors that need attention.');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  }
}

runTests();

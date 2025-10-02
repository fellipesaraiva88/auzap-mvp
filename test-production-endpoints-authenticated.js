#!/usr/bin/env node

const https = require('https');

const BASE_URL = 'https://auzap-api.onrender.com';

const results = {
  success: [],
  warnings: [],
  errors: [],
  responseTimes: {}
};

let authToken = null;
let organizationId = null;
let userId = null;

// Helper para fazer requests HTTPS
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const startTime = Date.now();

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const options = {
      method,
      headers: {
        ...defaultHeaders,
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
  const { statusCode, responseTime, body } = response;

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
    return true;
  } else {
    results.errors.push({
      endpoint,
      expected: expectedStatus,
      received: statusCode,
      responseTime,
      body
    });
    return false;
  }
}

// Setup: Autenticação
async function setup() {
  console.log('\n🔐 Setting up authentication...\n');

  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@auzap-test.com`;
  const testPassword = 'TestPassword123!';

  // Tentar login com credenciais conhecidas
  const loginAttempts = [
    { email: 'fellipesaraiva88@gmail.com', password: 'Magrelo@1515' },
    { email: 'admin@auzap.com', password: 'admin123' },
    { email: 'test@test.com', password: 'test123' }
  ];

  let authenticated = false;

  for (const cred of loginAttempts) {
    console.log(`   Trying login with: ${cred.email}`);
    const loginRes = await makeRequest('POST', '/api/auth/login', cred);

    if (loginRes.statusCode === 200) {
      authToken = loginRes.body.session?.access_token;
      organizationId = loginRes.body.userData?.organization_id;
      userId = loginRes.body.user?.id;
      console.log(`   ✓ Logged in successfully as: ${cred.email}`);
      authenticated = true;
      break;
    } else {
      console.log(`   ✗ Failed: ${loginRes.body?.error || 'Unknown error'}`);
    }
  }

  if (!authenticated) {
    console.log('\n   ⚠️  All login attempts failed');
    console.log('   Trying to register new user...');

    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword,
      full_name: 'Test User Production',
      organization_name: 'Test Organization Production'
    });

    if (registerRes.statusCode === 200) {
      authToken = registerRes.body.session?.access_token;
      organizationId = registerRes.body.userData?.organization_id || registerRes.body.organization?.id;
      userId = registerRes.body.user?.id;
      console.log(`   ✓ New user registered successfully`);
    } else {
      throw new Error('Failed to authenticate: ' + JSON.stringify(registerRes.body));
    }
  }

  console.log(`   Organization ID: ${organizationId}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Token: ${authToken?.substring(0, 20)}...`);

  if (!authToken || !organizationId) {
    throw new Error('Missing authentication credentials');
  }
}

// Testes organizados
const tests = {
  contacts: async () => {
    console.log('\n🔍 Testing CONTACTS endpoints...\n');

    // GET /api/contacts
    const list = await makeRequest('GET', `/api/contacts?organization_id=${organizationId}`);
    validateResponse('GET /api/contacts', list);

    // POST /api/contacts
    const newContact = await makeRequest('POST', '/api/contacts', {
      organization_id: organizationId,
      name: 'Test Contact Production',
      phone: '5511999998888',
      email: 'test@production.com'
    });

    if (validateResponse('POST /api/contacts', newContact, 200)) {
      const contactId = newContact.body?.id || newContact.body?.data?.id;

      if (contactId) {
        // GET /api/contacts/:id
        const get = await makeRequest('GET', `/api/contacts/${contactId}?organization_id=${organizationId}`);
        validateResponse(`GET /api/contacts/:id`, get);

        // PUT /api/contacts/:id
        const update = await makeRequest('PUT', `/api/contacts/${contactId}`, {
          organization_id: organizationId,
          name: 'Updated Test Contact'
        });
        validateResponse(`PUT /api/contacts/:id`, update);

        // DELETE /api/contacts/:id
        const del = await makeRequest('DELETE', `/api/contacts/${contactId}?organization_id=${organizationId}`);
        validateResponse(`DELETE /api/contacts/:id`, del);
      }
    }

    // GET /api/contacts/analytics/inactive
    const analytics = await makeRequest('GET', `/api/contacts/analytics/inactive?organization_id=${organizationId}`);
    validateResponse('GET /api/contacts/analytics/inactive', analytics);
  },

  pets: async () => {
    console.log('\n🐾 Testing PETS endpoints...\n');

    // GET /api/pets
    const list = await makeRequest('GET', `/api/pets?organization_id=${organizationId}`);
    validateResponse('GET /api/pets', list);

    // Precisamos de um contact_id válido
    const contactRes = await makeRequest('POST', '/api/contacts', {
      organization_id: organizationId,
      name: 'Pet Owner Test',
      phone: '5511888887777'
    });

    const contactId = contactRes.body?.id || contactRes.body?.data?.id;

    if (contactId) {
      // POST /api/pets
      const newPet = await makeRequest('POST', '/api/pets', {
        organization_id: organizationId,
        contact_id: contactId,
        name: 'Test Pet Production',
        species: 'dog',
        breed: 'Golden Retriever'
      });

      if (validateResponse('POST /api/pets', newPet, 200)) {
        const petId = newPet.body?.id || newPet.body?.data?.id;

        if (petId) {
          // GET /api/pets/:id
          const get = await makeRequest('GET', `/api/pets/${petId}?organization_id=${organizationId}`);
          validateResponse(`GET /api/pets/:id`, get);

          // PUT /api/pets/:id
          const update = await makeRequest('PUT', `/api/pets/${petId}`, {
            organization_id: organizationId,
            name: 'Updated Test Pet'
          });
          validateResponse(`PUT /api/pets/:id`, update);

          // DELETE /api/pets/:id
          const del = await makeRequest('DELETE', `/api/pets/${petId}?organization_id=${organizationId}`);
          validateResponse(`DELETE /api/pets/:id`, del);
        }
      }
    }

    // GET /api/pets/analytics/needing-service
    const analytics = await makeRequest('GET', `/api/pets/analytics/needing-service?organization_id=${organizationId}`);
    validateResponse('GET /api/pets/analytics/needing-service', analytics);
  },

  services: async () => {
    console.log('\n💼 Testing SERVICES endpoints...\n');

    // GET /api/services
    const list = await makeRequest('GET', `/api/services?organization_id=${organizationId}`);
    validateResponse('GET /api/services', list);

    // POST /api/services
    const newService = await makeRequest('POST', '/api/services', {
      organization_id: organizationId,
      name: 'Test Service Production',
      description: 'Test service for production validation',
      price: 150.00,
      duration_minutes: 60
    });

    if (validateResponse('POST /api/services', newService, 200)) {
      const serviceId = newService.body?.id || newService.body?.data?.id;

      if (serviceId) {
        // GET /api/services/:id
        const get = await makeRequest('GET', `/api/services/${serviceId}?organization_id=${organizationId}`);
        validateResponse(`GET /api/services/:id`, get);

        // PUT /api/services/:id
        const update = await makeRequest('PUT', `/api/services/${serviceId}`, {
          organization_id: organizationId,
          price: 175.00
        });
        validateResponse(`PUT /api/services/:id`, update);

        // DELETE /api/services/:id
        const del = await makeRequest('DELETE', `/api/services/${serviceId}?organization_id=${organizationId}`);
        validateResponse(`DELETE /api/services/:id`, del);
      }
    }

    // GET /api/services/analytics/popular
    const popular = await makeRequest('GET', `/api/services/analytics/popular?organization_id=${organizationId}`);
    validateResponse('GET /api/services/analytics/popular', popular);

    // GET /api/services/analytics/revenue
    const revenue = await makeRequest('GET', `/api/services/analytics/revenue?organization_id=${organizationId}`);
    validateResponse('GET /api/services/analytics/revenue', revenue);
  },

  bookings: async () => {
    console.log('\n📅 Testing BOOKINGS endpoints...\n');

    // GET /api/bookings
    const list = await makeRequest('GET', `/api/bookings?organization_id=${organizationId}`);
    validateResponse('GET /api/bookings', list);

    // Criar dados necessários
    const contactRes = await makeRequest('POST', '/api/contacts', {
      organization_id: organizationId,
      name: 'Booking Test Owner',
      phone: '5511777776666'
    });

    const contactId = contactRes.body?.id || contactRes.body?.data?.id;

    if (contactId) {
      const petRes = await makeRequest('POST', '/api/pets', {
        organization_id: organizationId,
        contact_id: contactId,
        name: 'Booking Test Pet',
        species: 'cat'
      });

      const serviceRes = await makeRequest('POST', '/api/services', {
        organization_id: organizationId,
        name: 'Booking Test Service',
        price: 100,
        duration_minutes: 30
      });

      const petId = petRes.body?.id || petRes.body?.data?.id;
      const serviceId = serviceRes.body?.id || serviceRes.body?.data?.id;

      if (petId && serviceId) {
        // POST /api/bookings
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);

        const newBooking = await makeRequest('POST', '/api/bookings', {
          organization_id: organizationId,
          pet_id: petId,
          service_id: serviceId,
          scheduled_at: tomorrow.toISOString(),
          status: 'scheduled'
        });

        if (validateResponse('POST /api/bookings', newBooking, 200)) {
          const bookingId = newBooking.body?.id || newBooking.body?.data?.id;

          if (bookingId) {
            // GET /api/bookings/:id
            const get = await makeRequest('GET', `/api/bookings/${bookingId}?organization_id=${organizationId}`);
            validateResponse(`GET /api/bookings/:id`, get);

            // PUT /api/bookings/:id
            const update = await makeRequest('PUT', `/api/bookings/${bookingId}`, {
              organization_id: organizationId,
              status: 'confirmed'
            });
            validateResponse(`PUT /api/bookings/:id`, update);

            // POST /api/bookings/:id/cancel
            const cancel = await makeRequest('POST', `/api/bookings/${bookingId}/cancel`, {
              organization_id: organizationId
            });
            validateResponse(`POST /api/bookings/:id/cancel`, cancel);
          }
        }
      }
    }

    // GET /api/bookings/availability/slots
    const availability = await makeRequest('GET', `/api/bookings/availability/slots?organization_id=${organizationId}&date=2025-10-03`);
    validateResponse('GET /api/bookings/availability/slots', availability);

    // GET /api/bookings/analytics/summary
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const summary = await makeRequest('GET', `/api/bookings/analytics/summary?organization_id=${organizationId}&date_from=${today}&date_to=${nextWeekStr}`);
    validateResponse('GET /api/bookings/analytics/summary', summary);
  }
};

// Executar todos os testes
async function runTests() {
  console.log('🚀 Starting Production Endpoint Tests (Authenticated)...');
  console.log(`📍 Base URL: ${BASE_URL}\n`);
  console.log('=' .repeat(60));

  try {
    await setup();

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
        console.log(`      Error: ${JSON.stringify(body).substring(0, 200)}`);
      });
    }

    // Performance
    console.log('\n📈 PERFORMANCE METRICS:');
    const times = Object.values(results.responseTimes);
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`   Average: ${avgTime.toFixed(0)}ms`);
      console.log(`   Min: ${minTime}ms`);
      console.log(`   Max: ${maxTime}ms`);
    }

    // Status final
    const total = results.success.length + results.warnings.length + results.errors.length;
    const successRate = total > 0 ? ((results.success.length / total) * 100).toFixed(1) : 0;

    console.log(`\n🎯 SUCCESS RATE: ${successRate}% (${results.success.length}/${total})`);

    if (results.errors.length === 0 && results.warnings.length === 0) {
      console.log('\n✨ All endpoints are working perfectly!');
    } else if (results.errors.length === 0) {
      console.log('\n✅ All endpoints are functional, but some have performance issues.');
    } else {
      console.log('\n❌ Some endpoints have critical errors that need attention.');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();

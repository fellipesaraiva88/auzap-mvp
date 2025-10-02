#!/usr/bin/env node

const https = require('https');

// Fazer request para criar usuário
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'https://auzap-api.onrender.com');

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: { raw: body }
          });
        }
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

async function createUser() {
  console.log('Creating test user...');

  const timestamp = Date.now();
  const response = await makeRequest('POST', '/api/auth/register', {
    email: `testuser${timestamp}@gmail.com`,
    password: 'testpassword123',
    full_name: 'Test User',
    organization_name: 'Test Organization'
  });

  console.log('Status:', response.statusCode);
  console.log('Response:', JSON.stringify(response.body, null, 2));

  if (response.statusCode === 200) {
    console.log('\n=== TEST CREDENTIALS ===');
    console.log('Email:', `testuser${timestamp}@gmail.com`);
    console.log('Password: testpassword123');
    console.log('Organization ID:', response.body.organization?.id || response.body.userData?.organization_id);
    console.log('========================');
  }
}

createUser().catch(console.error);

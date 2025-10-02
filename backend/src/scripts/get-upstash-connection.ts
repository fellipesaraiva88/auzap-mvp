/**
 * Script para obter informações de conexão do Upstash Redis
 *
 * Upstash oferece tanto REST API quanto conexão TCP Redis tradicional
 */

import { Redis as UpstashRedis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

async function getUpstashInfo() {
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}Upstash Redis Connection Info${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);

  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !token) {
    console.log(`${colors.yellow}⚠️  Upstash credentials not found in .env${colors.reset}\n`);
    return;
  }

  console.log(`${colors.cyan}REST API URL:${colors.reset}`);
  console.log(`  ${restUrl}\n`);

  console.log(`${colors.cyan}REST API Token:${colors.reset}`);
  console.log(`  ${token.substring(0, 20)}...${token.substring(token.length - 10)}\n`);

  // Extract host from REST URL
  const url = new URL(restUrl);
  const host = url.hostname;

  console.log(`${colors.bright}Redis TCP Connection (para BullMQ):${colors.reset}\n`);

  console.log(`${colors.cyan}1. Connection String:${colors.reset}`);
  console.log(`   redis://default:${token}@${host}:6379\n`);

  console.log(`${colors.cyan}2. Add to .env:${colors.reset}`);
  console.log(`   REDIS_URL=redis://default:${token}@${host}:6379\n`);

  console.log(`${colors.cyan}3. For Render.com:${colors.reset}`);
  console.log(`   Add environment variable in Render dashboard:`);
  console.log(`   Key: REDIS_URL`);
  console.log(`   Value: redis://default:${token}@${host}:6379\n`);

  console.log(`${colors.yellow}Note: Upstash Redis supports both REST API and TCP connections${colors.reset}`);
  console.log(`${colors.yellow}The same token works for both protocols${colors.reset}\n`);

  console.log(`${colors.bright}Testing TCP Connection...${colors.reset}\n`);

  try {
    const IORedis = require('ioredis');
    const redis = new IORedis({
      host,
      port: 6379,
      password: token,
      tls: {}, // Upstash requires TLS
      maxRetriesPerRequest: null,
    });

    await redis.ping();
    console.log(`${colors.green}✓ TCP Connection successful!${colors.reset}\n`);

    await redis.quit();
  } catch (error: any) {
    console.log(`${colors.yellow}⚠️  TCP Connection failed: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}   This is normal if Upstash free tier doesn't support TCP${colors.reset}`);
    console.log(`${colors.yellow}   Use REST API or upgrade to paid tier${colors.reset}\n`);
  }

  console.log(`${colors.bright}Documentation:${colors.reset}`);
  console.log(`  https://docs.upstash.com/redis/overall/getstarted\n`);
}

getUpstashInfo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

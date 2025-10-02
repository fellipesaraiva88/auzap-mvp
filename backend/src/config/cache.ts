import { connection, upstashRedis } from './redis';
import { logger } from './logger';
import crypto from 'crypto';

/**
 * Redis Cache Helper
 * Provides a simple interface for caching with TTL support
 */

export interface CacheOptions {
  ttl?: number; // TTL in seconds
  prefix?: string;
}

/**
 * Generate cache key with prefix
 */
function generateKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}:${key}` : key;
}

/**
 * Generate hash for sensitive data (like JWT tokens)
 */
export function hashKey(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Get value from cache
 */
export async function getCached<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  try {
    const fullKey = generateKey(key, options?.prefix);

    // Try Upstash first (production), fallback to IORedis
    let value: string | null = null;

    if (upstashRedis) {
      value = await upstashRedis.get<string>(fullKey);
    } else {
      value = await connection.get(fullKey);
    }

    if (!value) {
      logger.debug({ key: fullKey }, 'Cache miss');
      return null;
    }

    logger.debug({ key: fullKey }, 'Cache hit');
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error({ error, key }, 'Error getting from cache');
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  try {
    const fullKey = generateKey(key, options?.prefix);
    const serialized = JSON.stringify(value);
    const ttl = options?.ttl || 900; // Default 15min

    // Set in Redis with TTL
    if (upstashRedis) {
      await upstashRedis.set(fullKey, serialized, { ex: ttl });
    } else {
      await connection.setex(fullKey, ttl, serialized);
    }

    logger.debug({ key: fullKey, ttl }, 'Cache set');
  } catch (error) {
    logger.error({ error, key }, 'Error setting cache');
    // Don't throw - cache failures should not break the app
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(
  key: string,
  options?: CacheOptions
): Promise<void> {
  try {
    const fullKey = generateKey(key, options?.prefix);

    if (upstashRedis) {
      await upstashRedis.del(fullKey);
    } else {
      await connection.del(fullKey);
    }

    logger.debug({ key: fullKey }, 'Cache deleted');
  } catch (error) {
    logger.error({ error, key }, 'Error deleting from cache');
  }
}

/**
 * Get or set pattern: try cache first, compute if miss
 */
export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - compute value
  const value = await factory();

  // Store in cache (fire and forget)
  setCached(key, value, options).catch((err) =>
    logger.error({ err, key }, 'Error caching computed value')
  );

  return value;
}

/**
 * Clear all keys with a specific prefix
 */
export async function clearPrefix(prefix: string): Promise<void> {
  try {
    if (upstashRedis) {
      // Upstash doesn't support SCAN, so we need to track keys manually
      logger.warn(
        { prefix },
        'clearPrefix not fully supported with Upstash REST API'
      );
    } else {
      const stream = connection.scanStream({
        match: `${prefix}:*`,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length) {
          const pipeline = connection.pipeline();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      logger.info({ prefix }, 'Cache prefix cleared');
    }
  } catch (error) {
    logger.error({ error, prefix }, 'Error clearing cache prefix');
  }
}

/**
 * Increment counter in cache
 */
export async function incrementCached(
  key: string,
  options?: CacheOptions
): Promise<number> {
  try {
    const fullKey = generateKey(key, options?.prefix);

    let value: number;
    if (upstashRedis) {
      value = await upstashRedis.incr(fullKey);
      if (options?.ttl) {
        await upstashRedis.expire(fullKey, options.ttl);
      }
    } else {
      value = await connection.incr(fullKey);
      if (options?.ttl) {
        await connection.expire(fullKey, options.ttl);
      }
    }

    return value;
  } catch (error) {
    logger.error({ error, key }, 'Error incrementing cache');
    return 0;
  }
}

/**
 * Check if key exists
 */
export async function existsCached(
  key: string,
  options?: CacheOptions
): Promise<boolean> {
  try {
    const fullKey = generateKey(key, options?.prefix);

    if (upstashRedis) {
      const exists = await upstashRedis.exists(fullKey);
      return exists === 1;
    } else {
      const exists = await connection.exists(fullKey);
      return exists === 1;
    }
  } catch (error) {
    logger.error({ error, key }, 'Error checking cache existence');
    return false;
  }
}

/**
 * Get TTL of a key
 */
export async function getTTL(
  key: string,
  options?: CacheOptions
): Promise<number> {
  try {
    const fullKey = generateKey(key, options?.prefix);

    if (upstashRedis) {
      return await upstashRedis.ttl(fullKey);
    } else {
      return await connection.ttl(fullKey);
    }
  } catch (error) {
    logger.error({ error, key }, 'Error getting TTL');
    return -1;
  }
}

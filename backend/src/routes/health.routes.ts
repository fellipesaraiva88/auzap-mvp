import { Router, Request, Response } from 'express';
import { connection as redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
}

interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
  details?: any;
}

interface DetailedHealth extends HealthStatus {
  services: {
    redis: ServiceHealth;
    supabase: ServiceHealth;
  };
}

/**
 * Basic health check - always returns 200 if server is running
 * GET /health
 */
router.get('/', (_req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(200).json(health);
});

/**
 * Redis/BullMQ health check
 * GET /health/redis
 */
router.get('/redis', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  let health: ServiceHealth;

  try {
    // Check if Redis connection exists and is ready
    if (!redisConnection) {
      health = {
        status: 'down',
        error: 'Redis connection not configured',
      };
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'redis',
        ...health,
      });
    }

    // Check connection status
    const redisStatus = redisConnection.status;

    if (redisStatus === 'ready' || redisStatus === 'connect') {
      // Perform a ping to measure latency
      await redisConnection.ping();
      const latency = Date.now() - startTime;

      health = {
        status: 'up',
        latency,
        details: {
          connectionStatus: redisStatus,
        },
      };

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'redis',
        ...health,
      });
    } else {
      health = {
        status: 'down',
        error: `Redis connection status: ${redisStatus}`,
        details: {
          connectionStatus: redisStatus,
        },
      };

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'redis',
        ...health,
      });
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;

    health = {
      status: 'down',
      latency,
      error: error.message || 'Unknown error',
    };

    logger.error({ error }, 'Redis health check failed');

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'redis',
      ...health,
    });
  }
});

/**
 * Supabase health check
 * GET /health/supabase
 */
router.get('/supabase', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  let health: ServiceHealth;

  try {
    // Simple query to check Supabase connection
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    const latency = Date.now() - startTime;

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is acceptable
      health = {
        status: 'down',
        latency,
        error: error.message,
        details: {
          code: error.code,
        },
      };

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'supabase',
        ...health,
      });
    } else {
      health = {
        status: 'up',
        latency,
        details: {
          connected: true,
          hasData: !!data,
        },
      };

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'supabase',
        ...health,
      });
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;

    health = {
      status: 'down',
      latency,
      error: error.message || 'Unknown error',
    };

    logger.error({ error }, 'Supabase health check failed');

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'supabase',
      ...health,
    });
  }
});

/**
 * Detailed health check - combines all service checks
 * GET /health/detailed
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  const services: DetailedHealth['services'] = {
    redis: { status: 'down' },
    supabase: { status: 'down' },
  };

  // Check Redis
  try {
    if (
      redisConnection &&
      (redisConnection.status === 'ready' ||
        redisConnection.status === 'connect')
    ) {
      const startTime = Date.now();
      await redisConnection.ping();
      const latency = Date.now() - startTime;

      services.redis = {
        status: 'up',
        latency,
        details: {
          connectionStatus: redisConnection.status,
        },
      };
    } else {
      services.redis = {
        status: 'down',
        error: redisConnection
          ? `Connection status: ${redisConnection.status}`
          : 'Not configured',
      };
    }
  } catch (error: any) {
    services.redis = {
      status: 'down',
      error: error.message || 'Connection failed',
    };
  }

  // Check Supabase
  try {
    const startTime = Date.now();
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    const latency = Date.now() - startTime;

    if (!error || error.code === 'PGRST116') {
      services.supabase = {
        status: 'up',
        latency,
        details: {
          connected: true,
        },
      };
    } else {
      services.supabase = {
        status: 'down',
        latency,
        error: error.message,
      };
    }
  } catch (error: any) {
    services.supabase = {
      status: 'down',
      error: error.message || 'Connection failed',
    };
  }

  // Determine overall health status
  const allServicesUp = Object.values(services).every((s) => s.status === 'up');
  const anyServiceDown = Object.values(services).some(
    (s) => s.status === 'down'
  );

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  let httpStatus: number;

  if (allServicesUp) {
    overallStatus = 'healthy';
    httpStatus = 200;
  } else if (anyServiceDown && !allServicesUp) {
    overallStatus = 'degraded';
    httpStatus = 200; // Still return 200 for degraded (partial functionality)
  } else {
    overallStatus = 'unhealthy';
    httpStatus = 503;
  }

  const detailedHealth: DetailedHealth = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services,
  };

  res.status(httpStatus).json(detailedHealth);
});

export default router;

import pino from 'pino';

/**
 * Production-grade structured logging with Pino
 *
 * Features:
 * - JSON format for production (Docker/Railway/Render will capture)
 * - Pretty format for development
 * - Structured metadata: timestamp, service name, environment
 * - Log levels: error, warn, info, debug
 * - Performance optimized (Pino is faster than Winston)
 */

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Base metadata included in all logs
  base: {
    service: 'auzap-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },

  // Timestamp configuration
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Error serialization with stack traces
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Format based on environment
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{levelLabel} - {msg}',
        },
      }
    : undefined,

  // Redact sensitive data
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'api_key',
      'apiKey',
      'secret',
      'SUPABASE_KEY',
      'OPENAI_API_KEY',
    ],
    censor: '[REDACTED]',
  },
});

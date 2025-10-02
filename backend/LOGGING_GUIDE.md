# AuZap Backend Logging Guide

## Overview

The backend uses **Pino** for production-grade structured logging. Pino is faster and more performant than Winston, making it ideal for high-throughput Node.js applications.

## Configuration

**Location**: `/backend/src/config/logger.ts`

### Features

1. **JSON Format** - Production logs are in JSON for easy parsing by log aggregators
2. **Pretty Format** - Development logs are colorized and human-readable
3. **Structured Metadata** - All logs include timestamp, service name, environment
4. **Security** - Sensitive data (passwords, tokens, API keys) are automatically redacted
5. **Performance** - Pino is ~5x faster than Winston

### Environment Variables

```bash
# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Environment (affects format)
NODE_ENV=production  # JSON format
NODE_ENV=development # Pretty format
```

## Usage Examples

### Basic Logging

```typescript
import { logger } from '../config/logger';

// Info level
logger.info('Server started successfully');

// Warning
logger.warn('Rate limit approaching threshold');

// Error
logger.error('Database connection failed');

// Debug (only shown if LOG_LEVEL=debug)
logger.debug('Processing request details');
```

### Structured Logging with Metadata

```typescript
// Log with context
logger.info({
  userId: '123',
  action: 'login',
  ip: '192.168.1.1'
}, 'User logged in successfully');

// Log errors with details
logger.error({
  error: err,
  organizationId,
  instanceId
}, 'Failed to initialize WhatsApp instance');
```

## Best Practices

### DO:
- Use structured logging with context objects
- Log business events and state changes
- Include error context in error logs
- Use appropriate levels (error/warn/info/debug)

### DON'T:
- Log sensitive data (auto-redacted but be careful)
- Use string concatenation
- Log in tight loops
- Use console.log (always use logger)

## Production Output

### JSON Format
```json
{
  "level": 30,
  "timestamp": "2025-10-02T10:30:45.123Z",
  "service": "auzap-backend",
  "environment": "production",
  "msg": "Instance initialized successfully"
}
```

## Files Modified

1. `/backend/src/config/logger.ts` - Enhanced configuration
2. `/backend/src/middleware/aurora-auth.middleware.ts` - Replaced console.error
3. `/backend/src/index.ts` - Fixed PORT type issue

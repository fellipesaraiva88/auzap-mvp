import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './config/logger';
import { tenantMiddleware } from './middleware/tenant.middleware';
import whatsappRoutes from './routes/whatsapp.routes';
import whatsappHealthRoutes from './routes/whatsapp-health.routes';
import webhookRoutes from './routes/webhook.routes';
import authRoutes from './routes/auth.routes';
import contactsRoutes from './routes/contacts.routes';
import conversationsRoutes from './routes/conversations.routes';
import petsRoutes from './routes/pets.routes';
import bookingsRoutes from './routes/bookings.routes';
import servicesRoutes from './routes/services.routes';
import metricsRoutes from './routes/metrics.routes';
import capacityRoutes from './routes/capacity.routes';
import healthRoutes from './routes/health.routes';
import { startWorkers, stopWorkers } from './workers';

const app = express();
const httpServer = createServer(app);

// Configurar origens permitidas (produção + desenvolvimento)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://auzap-mvp-frontend.onrender.com',
].filter(Boolean);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Rate Limiting - Performance Best Practice
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(compression()); // Enable gzip compression
app.use(limiter); // Apply rate limiting
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Health check routes (sem tenant middleware)
app.use('/health', healthRoutes);

// Public routes (sem tenant middleware)
app.use('/api/auth', authRoutes);
app.use('/webhook', webhookRoutes);

// Protected routes (COM tenant middleware)
app.use('/api/contacts', tenantMiddleware, contactsRoutes);
app.use('/api/conversations', tenantMiddleware, conversationsRoutes);
app.use('/api/pets', tenantMiddleware, petsRoutes);
app.use('/api/bookings', tenantMiddleware, bookingsRoutes);
app.use('/api/services', tenantMiddleware, servicesRoutes);
app.use('/api/metrics', tenantMiddleware, metricsRoutes);
app.use('/api/capacity', tenantMiddleware, capacityRoutes);
app.use('/api/whatsapp', tenantMiddleware, whatsappRoutes);
app.use('/api/whatsapp', tenantMiddleware, whatsappHealthRoutes);

// Socket.IO para real-time
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  socket.on('join-organization', (organizationId) => {
    socket.join(`org-${organizationId}`);
    logger.info(
      { organizationId, socketId: socket.id },
      'Client joined organization room'
    );
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected');
  });
});

// Export io para usar em outros serviços
export { io };

// Error handling
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ error: err, path: req.path }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0'; // Railway requires binding to 0.0.0.0

httpServer.listen(PORT, HOST, () => {
  logger.info(`🚀 AuZap API server running on ${HOST}:${PORT}`);
  logger.info(`📡 Socket.IO server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Inicializar workers
  startWorkers();
});

// Graceful shutdown with comprehensive cleanup
let isShuttingDown = false;
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds max

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn({ signal }, 'Shutdown already in progress, ignoring signal');
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, '🛑 Graceful shutdown initiated');

  // Set timeout to force exit if graceful shutdown takes too long
  const forceExitTimer = setTimeout(() => {
    logger.error('⚠️  Graceful shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Step 1: Stop accepting new connections
    logger.info('📡 Closing HTTP server (no new connections)...');
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) {
          logger.error({ error: err }, '❌ Error closing HTTP server');
          reject(err);
        } else {
          logger.info('✅ HTTP server closed');
          resolve();
        }
      });
    });

    // Step 2: Close Socket.IO connections
    logger.info('🔌 Closing Socket.IO connections...');
    await new Promise<void>((resolve) => {
      io.close(() => {
        logger.info('✅ Socket.IO closed');
        resolve();
      });
    });

    // Step 3: Stop BullMQ workers and queues
    logger.info('⚙️  Stopping BullMQ workers...');
    await stopWorkers();
    logger.info('✅ BullMQ workers stopped');

    // Step 4: Close Redis connections (if exists)
    logger.info('🔴 Closing Redis connections...');
    const { connection } = await import('./config/redis');
    if (connection && connection.status !== 'end') {
      await connection.quit();
      logger.info('✅ Redis connection closed');
    }

    // Step 5: Cleanup complete
    clearTimeout(forceExitTimer);
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error({ error }, '❌ Error during graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, '❌ Uncaught exception');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, '❌ Unhandled promise rejection');
  gracefulShutdown('unhandledRejection');
});

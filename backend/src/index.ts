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

// Health check (sem tenant middleware)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Railway requires binding to 0.0.0.0

httpServer.listen(PORT, HOST, () => {
  logger.info(`🚀 AuZap API server running on ${HOST}:${PORT}`);
  logger.info(`📡 Socket.IO server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Inicializar workers
  startWorkers();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  await stopWorkers();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server...');
  await stopWorkers();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

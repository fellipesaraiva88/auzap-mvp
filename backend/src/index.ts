import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './config/logger';
import whatsappRoutes from './routes/whatsapp.routes';
import webhookRoutes from './routes/webhook.routes';
import authRoutes from './routes/auth.routes';
import contactsRoutes from './routes/contacts.routes';
import bookingsRoutes from './routes/bookings.routes';
import servicesRoutes from './routes/services.routes';
import { startWorkers, stopWorkers } from './workers';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/webhook', webhookRoutes);

// Socket.IO para real-time
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  socket.on('join-organization', (organizationId) => {
    socket.join(`org-${organizationId}`);
    logger.info({ organizationId, socketId: socket.id }, 'Client joined organization room');
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected');
  });
});

// Export io para usar em outros serviços
export { io };

// Error handling
app.use((err: any, req: express.Request, res: express.Response) => {
  logger.error({ error: err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 AuZap API server running on port ${PORT}`);
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

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger.js';
import { supabaseAdmin } from './config/supabase.js';

const app = express();
const httpServer = createServer(app);

// Trust proxy - necessário para Render e rate limiting
app.set('trust proxy', 1);

// Socket.io setup
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Health checks
app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

app.get('/health/redis', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { redisCache } = await import('./config/redis.js');
    await redisCache.ping();
    res.json({ status: 'ok', redis: { connected: true } });
  } catch (error) {
    res.status(503).json({ status: 'error', redis: { connected: false, error } });
  }
});

app.get('/health/supabase', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) throw error;

    res.json({ status: 'ok', database: { connected: true } });
  } catch (error) {
    res.status(503).json({ status: 'error', database: { connected: false, error } });
  }
});

// Routes
app.use('/api/auth', (await import('./routes/auth.routes.js')).default);
app.use('/api/dashboard', (await import('./routes/dashboard.routes.js')).default);
app.use('/api/whatsapp', (await import('./routes/whatsapp.routes.js')).default);
app.use('/api/aurora', (await import('./routes/aurora.routes.js')).default);
app.use('/api/contacts', (await import('./routes/contacts.routes.js')).default);
app.use('/api/pets', (await import('./routes/pets.routes.js')).default);
app.use('/api/bookings', (await import('./routes/bookings.routes.js')).default);
app.use('/api/followups', (await import('./routes/followups.routes.js')).default);
app.use('/api/settings', (await import('./routes/settings.routes.js')).default);
app.use('/api/automations', (await import('./routes/automations.routes.js')).default);
app.use('/api/conversations', (await import('./routes/conversations.routes.js')).default);

// Socket.io connection handling with JWT authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const organizationId = socket.handshake.query.organizationId;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    if (!organizationId) {
      return next(new Error('Organization ID required'));
    }

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.error({ error }, 'Socket.io authentication failed');
      return next(new Error('Invalid or expired token'));
    }

    // Verify user belongs to the organization
    const { data: membership } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (!membership) {
      logger.error({ userId: user.id, organizationId }, 'User does not belong to organization');
      return next(new Error('Access denied to organization'));
    }

    // Attach user data to socket
    socket.data.userId = user.id;
    socket.data.organizationId = organizationId as string;

    logger.info({ userId: user.id, organizationId }, 'Socket.io authenticated');
    next();
  } catch (error: any) {
    logger.error({ error }, 'Socket.io authentication error');
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const { userId, organizationId } = socket.data;
  logger.info({ socketId: socket.id, userId, organizationId }, 'Client connected via Socket.io');

  // Automatically join organization room
  socket.join(`org:${organizationId}`);
  logger.info({ socketId: socket.id, organizationId }, 'Client joined organization room');

  // Emit initial connection confirmation
  socket.emit('authenticated', {
    userId,
    organizationId,
    timestamp: new Date().toISOString()
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id, userId, organizationId }, 'Client disconnected');
  });
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  logger.error({ error: err, path: _req.path }, 'Unhandled error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'AuZap Backend Server started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, httpServer };

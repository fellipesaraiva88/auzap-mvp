import express from 'express';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger.js';
import { supabaseAdmin } from './config/supabase.js';

const app = express();
const httpServer = createServer(app);

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
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

app.get('/health/redis', async (req, res) => {
  try {
    const { redisCache } = await import('./config/redis.js');
    await redisCache.ping();
    res.json({ status: 'ok', redis: { connected: true } });
  } catch (error) {
    res.status(503).json({ status: 'error', redis: { connected: false, error } });
  }
});

app.get('/health/supabase', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
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
app.use('/api/whatsapp', (await import('./routes/whatsapp.routes.js')).default);
app.use('/api/aurora', (await import('./routes/aurora.routes.js')).default);
app.use('/api/contacts', (await import('./routes/contacts.routes.js')).default);
app.use('/api/pets', (await import('./routes/pets.routes.js')).default);
app.use('/api/bookings', (await import('./routes/bookings.routes.js')).default);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected via Socket.io');

  socket.on('join-organization', (organizationId: string) => {
    socket.join(`org:${organizationId}`);
    logger.info({ socketId: socket.id, organizationId }, 'Client joined organization room');
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected');
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ error: err, path: req.path }, 'Unhandled error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404
app.use((req, res) => {
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

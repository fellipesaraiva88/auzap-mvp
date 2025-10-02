import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// TODO: Fix WhatsApp routes - temporarily disabled for build
// See whatsapp.routes.BACKUP.ts for original implementation

router.get('/status', async (req, res) => {
  res.json({ status: 'WhatsApp routes temporarily disabled - being fixed' });
});

export default router;

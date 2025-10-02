import express from 'express';

const router = express.Router();

// TODO: Fix WhatsApp routes - temporarily disabled for build
// Will be reimplemented with proper BaileysService integration

router.get('/status', async (_req, res) => {
  res.json({ status: 'WhatsApp routes temporarily disabled - being fixed' });
});

export default router;

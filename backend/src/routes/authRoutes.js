import express from 'express';
import { login, me, ocLogin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.post('/login', login);
router.post('/oc-login', ocLogin);
router.get('/me', requireAuth, me);
export default router;
import express from 'express';
import { initiatePayment, verifyPayment, confirmManualPayment, uploadPaymentProof } from '../controllers/paymentcontroller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);
router.post('/upload-proof', uploadPaymentProof);

// Admin only
router.patch('/confirm/:registrationId', requireAuth, confirmManualPayment);

export default router;

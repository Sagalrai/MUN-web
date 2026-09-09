import express from 'express';
import multer from 'multer';
import { initiatePayment, verifyPayment, confirmManualPayment, uploadPaymentProof } from '../controllers/paymentcontroller.js';
import { requireAuth } from '../middleware/auth.js';
import { supportedImageTypes } from '../services/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, callback) => callback(null, supportedImageTypes.has(file.mimetype)) });

router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);
router.post('/upload-proof', upload.single('proof'), uploadPaymentProof);

// Admin only
router.patch('/confirm/:registrationId', requireAuth, confirmManualPayment);

export default router;

import express from 'express';
import multer from 'multer';
import { initiatePayment, verifyPayment, confirmManualPayment, uploadPaymentProof } from '../controllers/paymentcontroller.js';
import { requireAdmin, requireAuth, requireRegistrationAccess } from '../middleware/auth.js';
import { supportedImageTypes } from '../services/cloudinary.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, supportedImageTypes.has(file.mimetype)),
});

router.post('/initiate', requireRegistrationAccess, initiatePayment);
router.post('/verify', requireRegistrationAccess, verifyPayment);
router.post('/upload-proof', requireRegistrationAccess, upload.single('proof'), uploadPaymentProof);
router.patch('/confirm/:registrationId', requireAuth, requireAdmin, confirmManualPayment);

export default router;

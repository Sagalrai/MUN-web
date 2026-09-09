import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin, requireOc } from '../middleware/auth.js';
import { createExpense, finalizeOrientation, getReceipt, getReportMembers, listDailyReports, listExpenses, listOrientationReports, reviewOrientation, submitOrientation } from '../controllers/reportController.js';

const router = express.Router();
const receiptDirectory = path.resolve('uploads/receipts');
fs.mkdirSync(receiptDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: receiptDirectory, filename: (req, file, callback) => callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});

router.get('/members', getReportMembers);
router.get('/days', listDailyReports);
router.get('/orientation', listOrientationReports);
router.post('/orientation', submitOrientation);
router.patch('/orientation/:id/review', requireAdmin, reviewOrientation);
router.post('/orientation/:id/finalize', requireOc, finalizeOrientation);
router.get('/expenses', listExpenses);
router.post('/expenses', requireOc, upload.single('receipt'), createExpense);
router.get('/expenses/:id/receipt', getReceipt);

export default router;

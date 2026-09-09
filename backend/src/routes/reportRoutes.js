import express from 'express';
import multer from 'multer';
import { requireAdmin, requireOc } from '../middleware/auth.js';
import { supportedImageTypes } from '../services/cloudinary.js';
import { createExpense, finalizeOrientation, getReceipt, getReportMembers, listDailyReports, listExpenses, listOrientationReports, reviewOrientation, submitOrientation } from '../controllers/reportController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, supportedImageTypes.has(file.mimetype))
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

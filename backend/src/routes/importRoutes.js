import express from 'express';
import multer from 'multer';
import { confirmImport, previewImport } from '../controllers/importController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
router.post('/preview', upload.single('file'), previewImport);
router.post('/confirm', confirmImport);
export default router;
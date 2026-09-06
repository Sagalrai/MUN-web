import express from 'express';
import { getPublicDelegate } from '../controllers/delegateController.js';

const router = express.Router();
router.get('/delegate/:delegateId', getPublicDelegate);
export default router;
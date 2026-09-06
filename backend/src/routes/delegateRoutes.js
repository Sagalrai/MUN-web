import express from 'express';
import {
  getDelegates,
  getDelegateById,
  createDelegate,
  updateDelegate,
  deleteDelegate
} from '../controllers/delegateController.js';

const router = express.Router();

router.get('/', getDelegates);
router.get('/:id', getDelegateById);
router.post('/', createDelegate);
router.put('/:id', updateDelegate);
router.delete('/:id', deleteDelegate);

export default router;
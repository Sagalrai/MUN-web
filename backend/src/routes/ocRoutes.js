import express from 'express';
import {
  getOcs,
  getOcById,
  createOc,
  updateOc,
  deleteOc
} from '../controllers/ocController.js';

const router = express.Router();

router.get('/', getOcs);
router.get('/:id', getOcById);
router.post('/', createOc);
router.put('/:id', updateOc);
router.delete('/:id', deleteOc);

export default router;
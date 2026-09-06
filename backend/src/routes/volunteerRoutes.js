import express from 'express';
import {
  createVolunteer,
  deleteVolunteer,
  getVolunteerById,
  getVolunteers,
  updateVolunteer,
} from '../controllers/volunteerController.js';

const router = express.Router();

router.get('/', getVolunteers);
router.get('/:id', getVolunteerById);
router.post('/', createVolunteer);
router.put('/:id', updateVolunteer);
router.delete('/:id', deleteVolunteer);

export default router;
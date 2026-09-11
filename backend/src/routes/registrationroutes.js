import express from 'express';
import { createRegistration, getRegistrationById } from '../controllers/registrationController.js';
import { requireRegistrationAccess } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createRegistration);
router.get('/:id', requireRegistrationAccess, getRegistrationById);

export default router;

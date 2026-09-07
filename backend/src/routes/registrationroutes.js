import express from 'express';
import { createRegistration, getRegistrationById } from '../controllers/registrationController.js';

const router = express.Router();

router.post('/', createRegistration);
router.get('/:id', getRegistrationById);

export default router;

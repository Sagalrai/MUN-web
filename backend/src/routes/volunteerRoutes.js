import express from 'express';
import multer from 'multer';
import { supportedImageTypes } from '../services/cloudinary.js';
import {
  createVolunteer,
  deleteVolunteer,
  getVolunteerById,
  getVolunteers,
  updateVolunteer,
} from '../controllers/volunteerController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, callback) => callback(null, supportedImageTypes.has(file.mimetype)) });

router.get('/', getVolunteers);
router.get('/:id', getVolunteerById);
router.post('/', upload.single('photo'), createVolunteer);
router.put('/:id', upload.single('photo'), updateVolunteer);
router.delete('/:id', deleteVolunteer);

export default router;
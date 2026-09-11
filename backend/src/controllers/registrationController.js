import Registration from '../models/Registration.js';
import jwt from 'jsonwebtoken';

const registrationToken = (registration) => jwt.sign(
  { type: 'registration', registrationId: registration._id.toString() },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

export const createRegistration = async (req, res) => {
  try {
    const { name, email, phone, school, age, grade } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !school?.trim() || !age || !grade?.trim()) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!/^\+977\d{10}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid Nepal phone number' });
    if (!Number.isInteger(Number(age)) || Number(age) < 8 || Number(age) > 100) return res.status(400).json({ message: 'Enter a valid age' });

    // Check if already registered
    const existingRegistration = await Registration.findOne({ email: email.toLowerCase().trim() });
    if (existingRegistration) {
      return res.status(409).json({ message: 'This email already has a registration. Please use the original registration link or contact the conference team.' });
    }

    const registration = new Registration({
      name,
      email,
      phone,
      school,
      age,
      grade
    });

    const savedRegistration = await registration.save();
    res.status(201).json({ registration: savedRegistration, accessToken: registrationToken(savedRegistration) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'This email already has a registration.' });
    res.status(500).json({ message: 'Unable to create registration' });
  }
};

export const getRegistrationById = async (req, res) => {
  try {
    if (req.registrationAccess.registrationId !== req.params.id) return res.status(403).json({ message: 'You do not have access to this registration' });
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json(registration);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid registration ID' });
    res.status(500).json({ message: 'Unable to load registration' });
  }
};

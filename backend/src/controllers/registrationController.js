import Registration from '../models/Registration.js';

export const createRegistration = async (req, res) => {
  try {
    const { name, email, phone, school, age, grade } = req.body;

    if (!name || !email || !phone || !school || !age || !grade) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({ email });
    if (existingRegistration) {
      return res.status(400).json({ message: 'Email already registered' });
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
    res.status(201).json(savedRegistration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

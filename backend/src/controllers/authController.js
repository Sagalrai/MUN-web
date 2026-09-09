import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Volunteer from '../models/Volunteer.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { adminId: admin._id.toString(), role: admin.role, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const me = async (req, res) => {
  if (req.admin.userType === 'oc') {
    const volunteer = await Volunteer.findById(req.admin.userId);
    if (!volunteer) return res.status(404).json({ message: 'OC not found' });
    return res.json({ id: volunteer._id, name: volunteer.name, email: volunteer.email, role: 'OC', volunteerId: volunteer.volunteerId });
  }
  const admin = await Admin.findById(req.admin.adminId);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json({ id: admin._id, name: admin.name, email: admin.email, role: admin.role });
};

export const ocLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const volunteer = await Volunteer.findOne({ email: String(email || '').toLowerCase().trim() }).select('+passwordHash');
    if (!volunteer?.passwordHash || !(await bcrypt.compare(password || '', volunteer.passwordHash))) {
      return res.status(401).json({ message: 'Invalid OC email or password' });
    }
    const token = jwt.sign({ userType: 'oc', userId: volunteer._id.toString(), role: 'OC', name: volunteer.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: volunteer._id, name: volunteer.name, email: volunteer.email, role: 'OC', volunteerId: volunteer.volunteerId } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
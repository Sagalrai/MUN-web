import Volunteer from '../models/Volunteer.js';
import bcrypt from 'bcryptjs';
import { uploadImageBuffer } from '../services/cloudinary.js';

const editableFields = ['name', 'email', 'phone', 'school', 'role', 'photo'];

const pickEditableFields = (body) =>
  Object.fromEntries(editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

export const getVolunteers = async (req, res) => {
  try {
    const { search, role, school } = req.query;
    const query = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { volunteerId: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { school: { $regex: escapedSearch, $options: 'i' } },
        { role: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (school) query.school = school;

    const volunteers = await Volunteer.find(query).sort({ createdAt: -1 });
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ volunteerId: req.params.id });
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVolunteer = async (req, res) => {
  try {
    const { password, ...details } = req.body;
    const uploaded = req.file ? await uploadImageBuffer(req.file.buffer, { folder: 'qrmun/volunteers' }) : null;
    const volunteer = await Volunteer.create({ ...details, ...(uploaded ? { photo: uploaded.secure_url, photoPublicId: uploaded.public_id } : {}), ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) });
    res.status(201).json(volunteer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateVolunteer = async (req, res) => {
  try {
    const passwordUpdate = req.body.password ? { passwordHash: await bcrypt.hash(req.body.password, 12) } : {};
    const uploaded = req.file ? await uploadImageBuffer(req.file.buffer, { folder: 'qrmun/volunteers' }) : null;
    const volunteer = await Volunteer.findOneAndUpdate(
      { volunteerId: req.params.id },
      { ...pickEditableFields(req.body), ...(uploaded ? { photo: uploaded.secure_url, photoPublicId: uploaded.public_id } : {}), ...passwordUpdate },
      { returnDocument: 'after', runValidators: true }
    );
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.json(volunteer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOneAndDelete({ volunteerId: req.params.id });
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
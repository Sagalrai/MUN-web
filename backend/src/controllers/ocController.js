import Oc from '../models/Oc.js';

export const getOcs = async (req, res) => {
  try {
    const { search, department, position, school } = req.query;
    const query = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { ocId: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { school: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (position) query.position = position;
    if (school) query.school = school;

    const ocs = await Oc.find(query).sort({ createdAt: -1 });
    res.json(ocs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOcById = async (req, res) => {
  try {
    const oc = await Oc.findOne({ ocId: req.params.id });
    if (!oc) return res.status(404).json({ message: 'OC not found' });
    res.json(oc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOc = async (req, res) => {
  try {
    const { name, email, phone, school, department, position } = req.body;
    if (!name || !email || !phone || !school || !department || !position) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const oc = await new Oc({ name, email, phone, school, department, position }).save();
    res.status(201).json(oc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOc = async (req, res) => {
  try {
    const { name, email, phone, school, department, position } = req.body;
    const oc = await Oc.findOneAndUpdate(
      { ocId: req.params.id },
      { name, email, phone, school, department, position },
      { returnDocument: 'after', runValidators: true }
    );
    if (!oc) return res.status(404).json({ message: 'OC not found' });
    res.json(oc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOc = async (req, res) => {
  try {
    const oc = await Oc.findOneAndDelete({ ocId: req.params.id });
    if (!oc) return res.status(404).json({ message: 'OC not found' });
    res.json({ message: 'OC deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
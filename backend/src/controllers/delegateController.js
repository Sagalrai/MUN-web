import Delegate from '../models/delegate.js';

export const getDelegates = async (req, res) => {
  try {
    const { search, committee, country, school } = req.query;
    let query = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { delegateId: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { school: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    if (committee) query.committee = committee;
    if (country) query.country = country;
    if (school) query.school = school;

    const delegates = await Delegate.find(query).sort({ createdAt: -1 });
    res.json(delegates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDelegateById = async (req, res) => {
  try {
    const delegate = await Delegate.findOne({ delegateId: req.params.id });
    if (!delegate) {
      return res.status(404).json({ message: 'Delegate not found' });
    }
    res.json(delegate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDelegate = async (req, res) => {
  try {
    const { name, email, phone, school, committee, country } = req.body;
    if (!name || !email || !phone || !school || !committee || !country) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const delegate = new Delegate({
      name,
      email,
      phone,
      school,
      committee,
      country
    });

    const savedDelegate = await delegate.save();
    res.status(201).json(savedDelegate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDelegate = async (req, res) => {
  try {
    const { name, email, phone, school, committee, country } = req.body;
    const delegate = await Delegate.findOneAndUpdate(
      { delegateId: req.params.id },
      { name, email, phone, school, committee, country },
      { returnDocument: 'after', runValidators: true }
    );

    if (!delegate) {
      return res.status(404).json({ message: 'Delegate not found' });
    }
    res.json(delegate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDelegate = async (req, res) => {
  try {
    const delegate = await Delegate.findOneAndDelete({ delegateId: req.params.id });
    if (!delegate) {
      return res.status(404).json({ message: 'Delegate not found' });
    }
    res.json({ message: 'Delegate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicDelegate = async (req, res) => {
  try {
    const delegateId = decodeURIComponent(req.params.delegateId).trim();
    const delegate = await Delegate.findOne({ delegateId }).select('delegateId name school country committee');
    if (!delegate) return res.status(404).json({ message: 'Delegate not found' });
    res.json(delegate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
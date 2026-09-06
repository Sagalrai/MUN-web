import Delegate from '../models/delegate.js';
import Volunteer from '../models/Volunteer.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [totalDelegates, totalVolunteers, schools, countries, committees, recentDelegates, recentVolunteers] = await Promise.all([
      Delegate.countDocuments(),
      Volunteer.countDocuments(),
      Delegate.distinct('school'),
      Delegate.distinct('country'),
      Delegate.distinct('committee'),
      Delegate.find().sort({ createdAt: -1 }).limit(5).select('delegateId name createdAt'),
      Volunteer.find().sort({ createdAt: -1 }).limit(5).select('volunteerId name position createdAt'),
    ]);

    const activity = [
      ...recentDelegates.map((item) => ({ type: 'delegate', label: `${item.name} joined the registry`, id: item.delegateId, createdAt: item.createdAt })),
      ...recentVolunteers.map((item) => ({ type: 'volunteer', label: `${item.name} joined the team`, id: item.volunteerId, createdAt: item.createdAt })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

    res.json({ totalDelegates, totalVolunteers, schools: schools.length, countries: countries.length, committees: committees.length, activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
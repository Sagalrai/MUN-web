import mongoose from 'mongoose';
import Counter from './Counter.js';

const departments = ['Marketing & PR', 'Design & IT', 'Finance', 'Logistics', 'Delegate Affairs', 'Hospitality', 'Crisis', 'Executive Board'];
const positions = ['President', 'Vice President', 'Treasurer', 'Chapter Head', 'Chief of Staff', 'Secretary General', 'Director General', 'Head', 'Member'];

const volunteerSchema = new mongoose.Schema(
  {
    volunteerId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true, match: /^\+977\d{10}$/ },
    school: { type: String, required: true, trim: true },
    department: { type: String, required: true, enum: departments, trim: true },
    position: { type: String, required: true, enum: positions, trim: true },
    photo: { type: String, default: '' },
  },
  { timestamps: true }
);

volunteerSchema.pre('save', async function () {
  if (this.volunteerId) return;

  const counter = await Counter.findOneAndUpdate(
    { id: 'volunteerId' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  this.volunteerId = `VOL-${String(counter.seq).padStart(4, '0')}`;
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);
export default Volunteer;
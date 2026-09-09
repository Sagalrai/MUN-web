import mongoose from 'mongoose';
import Counter from './Counter.js';

const role = ['President', 'Vice President', 'Treasurer', 'Chief Of Staffs', 'Chapter Head', 'Secretary General', 'Director General','Marketing & PRO', 'Design & IT', 'Finance', 'Logistics', 'Delegate Affairs', 'Hospitality', 'Crisis',];

const volunteerSchema = new mongoose.Schema(
  {
    volunteerId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true, match: /^\+977\d{10}$/ },
    school: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: role, trim: true },
    photo: { type: String, default: '' },
    photoPublicId: { type: String, default: '' },
    passwordHash: { type: String, select: false },
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
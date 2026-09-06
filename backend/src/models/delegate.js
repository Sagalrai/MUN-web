import mongoose from 'mongoose';
import Counter from './Counter.js';

const delegateSchema = new mongoose.Schema(
  {
    delegateId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true, match: /^\+977\d{10}$/ },
    school: { type: String, required: true, trim: true },
    committee: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

delegateSchema.pre('save', async function () {
  if (this.delegateId) return;

  const counter = await Counter.findOneAndUpdate(
    { id: 'delegateId' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  this.delegateId = `DEL-${String(counter.seq).padStart(4, '0')}`;
});

const Delegate = mongoose.model('Delegate', delegateSchema);
export default Delegate;
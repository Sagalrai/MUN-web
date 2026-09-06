import mongoose from 'mongoose';
import Counter from './Counter.js';

const ocSchema = new mongoose.Schema(
  {
    ocId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    school: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

ocSchema.pre('save', async function () {
  if (this.ocId) return;

  const counter = await Counter.findOneAndUpdate(
    { id: 'ocId' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  this.ocId = `OC-${String(counter.seq).padStart(4, '0')}`;
});

const Oc = mongoose.model('Oc', ocSchema);
export default Oc;
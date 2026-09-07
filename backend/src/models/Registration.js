import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    school: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    grade: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'verified'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['esewa', 'manual', 'none'],
      default: 'none'
    },
    paymentProof: { type: String }, // Path to uploaded screenshot for manual payments
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
  },
  { timestamps: true }
);

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;

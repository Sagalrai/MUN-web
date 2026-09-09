import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  item: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  totalCost: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, required: true },
  purpose: { type: String, required: true, trim: true },
  receiptPath: { type: String, required: true },
  receiptMimeType: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);

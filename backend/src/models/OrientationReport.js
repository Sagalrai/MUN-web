import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  status: { type: String, enum: ['Present', 'Absent'], required: true }
}, { _id: false });

const orientationReportSchema = new mongoose.Schema({
  event: { type: String, required: true, trim: true },
  orientationDate: { type: Date, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  expectedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true }],
  reviewStatus: { type: String, enum: ['Draft', 'Pending Review', 'Approved', 'Returned', 'Attendance Pending', 'Finalized'], default: 'Pending Review' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: Date,
  returnReason: { type: String, trim: true },
  actualAttendance: [attendanceSchema],
  finalizedAt: Date
}, { timestamps: true });

export default mongoose.model('OrientationReport', orientationReportSchema);

import path from 'node:path';
import OrientationReport from '../models/OrientationReport.js';
import Expense from '../models/Expense.js';
import Volunteer from '../models/Volunteer.js';
import { uploadImageBuffer } from '../services/cloudinary.js';

const memberSelect = 'name volunteerId email school role';
const populateReport = (query) => query.populate('submittedBy', memberSelect).populate('expectedMembers', memberSelect).populate('actualAttendance.member', memberSelect).populate('reviewedBy', 'name email role');
const dayStart = (value) => {
  const text = String(value || '').slice(0, 10);
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

export const getReportMembers = async (req, res) => {
  try { res.json(await Volunteer.find().select(memberSelect).sort({ name: 1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

export const listOrientationReports = async (req, res) => {
  try {
    const query = req.admin.userType === 'oc' ? { submittedBy: req.admin.userId } : {};
    res.json(await populateReport(OrientationReport.find(query).sort({ createdAt: -1 })));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const listDailyReports = async (req, res) => {
  try {
    const ownOnly = req.admin.userType === 'oc' ? { submittedBy: req.admin.userId } : {};
    const selectedDay = req.query.date ? dayStart(req.query.date) : null;
    const nextDay = selectedDay ? new Date(selectedDay.getTime() + 86400000) : null;
    const dateFilter = selectedDay ? { $gte: selectedDay, $lt: nextDay } : null;
    const orientationQuery = dateFilter ? { ...ownOnly, $or: [{ reportDate: dateFilter }, { reportDate: { $exists: false }, orientationDate: dateFilter }] } : ownOnly;
    const expenseQuery = dateFilter ? { ...ownOnly, $or: [{ reportDate: dateFilter }, { reportDate: { $exists: false }, purchaseDate: dateFilter }] } : ownOnly;
    const [orientationReports, expenses] = await Promise.all([
      populateReport(OrientationReport.find(orientationQuery).sort({ createdAt: -1 })),
      Expense.find(expenseQuery).populate('submittedBy', memberSelect).sort({ createdAt: -1 })
    ]);
    const grouped = new Map();
    const getDay = (date) => {
      const key = dayKey(date);
      if (!grouped.has(key)) grouped.set(key, { date: key, orientationReports: [], expenses: [] });
      return grouped.get(key);
    };
    orientationReports.forEach((report) => getDay(report.reportDate || report.orientationDate).orientationReports.push(report));
    expenses.forEach((expense) => getDay(expense.reportDate || expense.purchaseDate).expenses.push(expense));
    const days = [...grouped.values()].sort((a, b) => b.date.localeCompare(a.date)).map((day) => {
      const latestAttendance = day.orientationReports.find((report) => report.actualAttendance?.length);
      const latestExpected = day.orientationReports[0];
      const actual = latestAttendance?.actualAttendance || [];
      return {
        ...day,
        summary: {
          expected: latestExpected?.expectedMembers?.length || 0,
          present: actual.filter((entry) => entry.status === 'Present').length,
          absent: actual.filter((entry) => entry.status === 'Absent').length,
          purchaseTotal: day.expenses.reduce((total, expense) => total + Number(expense.totalCost || 0), 0),
          purchaseCount: day.expenses.length,
          submissionCount: day.orientationReports.length + day.expenses.length
        }
      };
    });
    res.json(days);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const submitOrientation = async (req, res) => {
  try {
    const { event, orientationDate, expectedMemberIds } = req.body;
    if (!event || !orientationDate || !Array.isArray(expectedMemberIds) || expectedMemberIds.length === 0) return res.status(400).json({ message: 'Event, orientation date, and expected members are required' });
    const memberIds = [...new Set(expectedMemberIds.map(String))];
    const members = await Volunteer.find({ _id: { $in: memberIds } }).select('_id');
    if (members.length !== memberIds.length) return res.status(400).json({ message: 'One or more selected OCs are not in the official list' });
    const submittedBy = req.admin.userType === 'oc' ? req.admin.userId : req.body.submittedBy;
    if (!submittedBy || !members.some((member) => member._id.toString() === submittedBy)) return res.status(400).json({ message: 'A valid submitting OC is required' });
    const report = await OrientationReport.create({ event, orientationDate, reportDate: dayStart(orientationDate), submittedBy, expectedMembers: memberIds, reviewStatus: 'Pending Review' });
    res.status(201).json(await populateReport(OrientationReport.findById(report._id)));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const reviewOrientation = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['Approved', 'Returned'].includes(status)) return res.status(400).json({ message: 'Review status must be Approved or Returned' });
    const report = await OrientationReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Orientation report not found' });
    if (report.reviewStatus !== 'Pending Review') return res.status(409).json({ message: 'Only pending reports can be reviewed' });
    report.reviewStatus = status;
    report.reviewedBy = req.admin.adminId;
    report.reviewedAt = new Date();
    report.returnReason = status === 'Returned' ? String(reason || '').trim() : '';
    await report.save();
    res.json(await populateReport(OrientationReport.findById(report._id)));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const finalizeOrientation = async (req, res) => {
  try {
    const report = await OrientationReport.findOne({ _id: req.params.id, submittedBy: req.admin.userId });
    if (!report) return res.status(404).json({ message: 'Orientation report not found' });
    if (report.reviewStatus !== 'Approved') return res.status(409).json({ message: 'Final attendance requires an approved expected list' });
    if (report.actualAttendance?.length) return res.status(409).json({ message: 'Final attendance has already been submitted' });
    const attendance = Array.isArray(req.body.attendance) ? req.body.attendance : [];
    const expected = report.expectedMembers.map(String).sort();
    const submitted = attendance.map((entry) => String(entry.member)).sort();
    if (expected.length !== submitted.length || expected.some((id, index) => id !== submitted[index]) || attendance.some((entry) => !['Present', 'Absent'].includes(entry.status))) return res.status(400).json({ message: 'Attendance must include each expected member exactly once' });
    report.actualAttendance = attendance;
    report.reviewStatus = 'Finalized';
    report.finalizedAt = new Date();
    await report.save();
    res.json(await populateReport(OrientationReport.findById(report._id)));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const listExpenses = async (req, res) => {
  try {
    const query = req.admin.userType === 'oc' ? { submittedBy: req.admin.userId } : {};
    res.json(await Expense.find(query).populate('submittedBy', memberSelect).sort({ createdAt: -1 }));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const createExpense = async (req, res) => {
  try {
    const { item, quantity, totalCost, purchaseDate, purpose } = req.body;
    if (!item || !quantity || totalCost === undefined || !purchaseDate || !purpose || !req.file) return res.status(400).json({ message: 'All purchase fields and a receipt image are required' });
    const uploaded = await uploadImageBuffer(req.file.buffer, { folder: 'qrmun/receipts' });
    const expense = await Expense.create({ submittedBy: req.admin.userId, reportDate: dayStart(purchaseDate), item, quantity, totalCost, purchaseDate, purpose, receiptUrl: uploaded.secure_url, receiptPublicId: uploaded.public_id, receiptMimeType: req.file.mimetype });
    res.status(201).json(await Expense.findById(expense._id).populate('submittedBy', memberSelect));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const getReceipt = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || (req.admin.userType === 'oc' && expense.submittedBy.toString() !== req.admin.userId)) return res.status(404).json({ message: 'Receipt not found' });
    const receiptReference = expense.receiptUrl || expense.receiptPath;
    if (!receiptReference) return res.status(404).json({ message: 'Receipt not found' });
    if (/^https?:\/\//i.test(receiptReference)) {
      const response = await fetch(receiptReference);
      if (!response.ok) return res.status(404).json({ message: 'Receipt not found' });
      res.type(expense.receiptMimeType).send(Buffer.from(await response.arrayBuffer()));
      return;
    }
    res.type(expense.receiptMimeType).sendFile(path.resolve(receiptReference));
  } catch (error) { res.status(404).json({ message: 'Receipt not found' }); }
};

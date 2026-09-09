import fs from 'node:fs';
import path from 'node:path';
import OrientationReport from '../models/OrientationReport.js';
import Expense from '../models/Expense.js';
import Volunteer from '../models/Volunteer.js';

const memberSelect = 'name volunteerId email school role';
const populateReport = (query) => query.populate('submittedBy', memberSelect).populate('expectedMembers', memberSelect).populate('actualAttendance.member', memberSelect).populate('reviewedBy', 'name email role');

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

export const submitOrientation = async (req, res) => {
  try {
    const { event, orientationDate, expectedMemberIds } = req.body;
    if (!event || !orientationDate || !Array.isArray(expectedMemberIds) || expectedMemberIds.length === 0) return res.status(400).json({ message: 'Event, orientation date, and expected members are required' });
    const memberIds = [...new Set(expectedMemberIds.map(String))];
    const members = await Volunteer.find({ _id: { $in: memberIds } }).select('_id');
    if (members.length !== memberIds.length) return res.status(400).json({ message: 'One or more selected OCs are not in the official list' });
    const submittedBy = req.admin.userType === 'oc' ? req.admin.userId : req.body.submittedBy;
    if (!submittedBy || !members.some((member) => member._id.toString() === submittedBy)) return res.status(400).json({ message: 'A valid submitting OC is required' });
    const report = await OrientationReport.create({ event, orientationDate, submittedBy, expectedMembers: memberIds, reviewStatus: 'Pending Review' });
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
    const expense = await Expense.create({ submittedBy: req.admin.userId, item, quantity, totalCost, purchaseDate, purpose, receiptPath: req.file.path, receiptMimeType: req.file.mimetype });
    res.status(201).json(await Expense.findById(expense._id).populate('submittedBy', memberSelect));
  } catch (error) { if (req.file?.path) fs.rmSync(req.file.path, { force: true }); res.status(400).json({ message: error.message }); }
};

export const getReceipt = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || (req.admin.userType === 'oc' && expense.submittedBy.toString() !== req.admin.userId)) return res.status(404).json({ message: 'Receipt not found' });
    res.type(expense.receiptMimeType).sendFile(path.resolve(expense.receiptPath));
  } catch (error) { res.status(404).json({ message: 'Receipt not found' }); }
};

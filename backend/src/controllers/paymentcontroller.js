import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Delegate from '../models/delegate.js';
import { uploadImageBuffer } from '../services/cloudinary.js';

const registrationFee = Number(process.env.REGISTRATION_FEE || 1000);
const ownsRegistration = (req, registrationId) => req.registrationAccess?.registrationId === String(registrationId);

const createDelegateIfNeeded = async (registration) => {
  const existing = await Delegate.findOne({ email: registration.email });
  if (existing) return existing;
  return new Delegate({ name: registration.name, email: registration.email, phone: registration.phone, school: registration.school, committee: 'TBD', country: 'TBD' }).save();
};

export const initiatePayment = async (req, res) => {
  try {
    const { registrationId, method } = req.body;
    if (!registrationId || method !== 'manual') return res.status(400).json({ message: 'A valid registration and manual payment method are required' });
    if (!ownsRegistration(req, registrationId)) return res.status(403).json({ message: 'You do not have access to this registration' });
    const registration = await Registration.findById(registrationId);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.status !== 'pending') return res.status(409).json({ message: 'This registration already has a payment submission' });
    registration.paymentMethod = 'manual';
    await registration.save();
    res.json({ success: true, registrationId, amount: registrationFee, message: 'Upload your payment proof to submit it for review.' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid registration ID' });
    res.status(500).json({ message: 'Unable to start payment' });
  }
};

// A browser must never be able to mark a payment successful. Add a verified
// gateway webhook here before enabling online-gateway payments.
export const verifyPayment = async (req, res) => res.status(501).json({ message: 'Online payment verification is not configured yet' });

export const uploadPaymentProof = async (req, res) => {
  try {
    const { registrationId } = req.body;
    if (!registrationId || !req.file) return res.status(400).json({ message: 'A registration ID and payment-proof image are required' });
    if (!ownsRegistration(req, registrationId)) return res.status(403).json({ message: 'You do not have access to this registration' });
    const registration = await Registration.findById(registrationId);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.status !== 'pending' || registration.paymentId) return res.status(409).json({ message: 'A payment has already been submitted for this registration' });
    const uploaded = await uploadImageBuffer(req.file.buffer, { folder: 'qrmun/payment-proofs' });
    const payment = await new Payment({ registrationId, transactionId: `MANUAL-${registrationId}`, amount: registrationFee, status: 'pending', gateway: 'manual' }).save();
    registration.paymentProof = uploaded.secure_url;
    registration.paymentProofPublicId = uploaded.public_id;
    registration.paymentMethod = 'manual';
    registration.paymentId = payment._id;
    registration.status = 'paid';
    await registration.save();
    res.status(201).json({ success: true, status: registration.status, message: 'Payment proof submitted for review.' });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'A payment has already been submitted for this registration' });
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid registration ID' });
    res.status(500).json({ message: 'Unable to submit payment proof' });
  }
};

export const confirmManualPayment = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.status === 'verified') return res.status(409).json({ message: 'Payment is already verified' });
    if (registration.status !== 'paid' || !registration.paymentId) return res.status(400).json({ message: 'No submitted payment proof exists for this registration' });
    const payment = await Payment.findById(registration.paymentId);
    if (!payment) return res.status(400).json({ message: 'Payment record not found' });
    payment.status = 'success';
    await payment.save();
    registration.status = 'verified';
    await registration.save();
    const delegate = await createDelegateIfNeeded(registration);
    res.json({ success: true, message: 'Manual payment confirmed', delegateId: delegate.delegateId });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid registration ID' });
    res.status(500).json({ message: 'Unable to confirm payment' });
  }
};

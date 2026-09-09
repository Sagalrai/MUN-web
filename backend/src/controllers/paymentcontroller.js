import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Delegate from '../models/delegate.js';
import { uploadImageBuffer } from '../services/cloudinary.js';

export const initiatePayment = async (req, res) => {
  try {
    const { registrationId, method, amount } = req.body;

    if (!registrationId || !method || !amount) {
      return res.status(400).json({ message: 'Registration ID, method, and amount are required' });
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.paymentMethod = method;
    await registration.save();

    if (method === 'esewa') {
      // In a real eSewa integration, you would call eSewa API here to get a payment URL
      // For now, we provide a mock success response or a mock URL
      return res.json({
        success: true,
        message: 'Redirecting to eSewa...',
        paymentUrl: 'https://example.com/esewa-mock-payment', // Mock URL
        registrationId
      });
    } else if (method === 'manual') {
      return res.json({
        success: true,
        message: 'Please upload your payment proof.',
        registrationId
      });
    }

    res.status(400).json({ message: 'Invalid payment method' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { registrationId, transactionId, amount, gateway } = req.body;

    if (!registrationId || !transactionId || !amount || !gateway) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    // MOCK VERIFICATION: In production, call eSewa/Gateway API to verify transactionId
    const isVerified = transactionId.startsWith('TXN'); // Mock condition

    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const payment = new Payment({
      registrationId,
      transactionId,
      amount,
      status: 'success',
      gateway
    });
    const savedPayment = await payment.save();

    const registration = await Registration.findById(registrationId);
    registration.status = 'verified';
    registration.paymentId = savedPayment._id;
    await registration.save();

    // Create Official Delegate Record
    const delegate = new Delegate({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      school: registration.school,
      committee: 'TBD', // Allotted later
      country: 'TBD'    // Allotted later
    });
    const savedDelegate = await delegate.save();

    res.json({
      success: true,
      message: 'Payment verified and registration completed',
      delegateId: savedDelegate.delegateId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmManualPayment = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'verified';
    await registration.save();

    // Create Official Delegate Record
    const delegate = new Delegate({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      school: registration.school,
      committee: 'TBD',
      country: 'TBD'
    });
    const savedDelegate = await delegate.save();

    res.json({
      success: true,
      message: 'Manual payment confirmed',
      delegateId: savedDelegate.delegateId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadPaymentProof = async (req, res) => {
  try {
    const { registrationId, proofUrl } = req.body;
    if (!registrationId || (!req.file && !proofUrl)) return res.status(400).json({ message: 'Registration ID and payment proof are required' });

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file.buffer, { folder: 'qrmun/payment-proofs' });
      registration.paymentProof = uploaded.secure_url;
      registration.paymentProofPublicId = uploaded.public_id;
    } else {
      registration.paymentProof = proofUrl;
    }
    registration.status = 'paid';
    registration.paymentMethod = 'manual';
    await registration.save();

    res.json({ success: true, message: 'Payment proof uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

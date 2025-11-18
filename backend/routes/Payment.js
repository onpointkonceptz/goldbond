const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect, adminAuth } = require('../middleware/auth');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key';

// Helper function to verify Paystack signature
const verifyPaystackSignature = (payload, signature) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
};

// -------------------------
// Initialize Payment
// -------------------------
router.post('/initialize', protect, async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod = 'card', currency = 'NGN' } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'Booking ID and amount are required' });
    }

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const existingPayment = await Payment.findOne({
      booking: bookingId,
      status: { $in: ['completed', 'processing'] }
    });
    if (existingPayment) return res.status(400).json({ error: 'Payment already exists for this booking' });

    const payment = new Payment({
      user: req.user._id,
      booking: bookingId,
      amount,
      currency,
      paymentMethod,
      paymentProvider: paymentMethod === 'cash' ? 'cash' : 'paystack',
      description: `Payment for ${booking.testType} - ${booking.referenceNumber}`,
      metadata: {
        bookingReference: booking.referenceNumber,
        testType: booking.testType,
        customerName: `${req.user.firstName} ${req.user.lastName}`,
        customerEmail: req.user.email
      }
    });

    await payment.save();

    if (paymentMethod === 'cash') {
      return res.status(201).json({
        success: true,
        message: 'Cash payment initialized',
        payment: {
          id: payment._id,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod
        }
      });
    }

    // Online payment via Paystack
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: amount * 100,
        email: req.user.email,
        reference: payment.reference,
        currency,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=success`,
        metadata: {
          payment_id: payment._id.toString(),
          booking_id: bookingId,
          custom_fields: [
            { display_name: 'Test Type', variable_name: 'test_type', value: booking.testType },
            { display_name: 'Booking Reference', variable_name: 'booking_reference', value: booking.referenceNumber }
          ]
        }
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    if (paystackResponse.data.status) {
      payment.status = 'processing';
      payment.providerResponse = paystackResponse.data.data;
      await payment.save();

      return res.status(201).json({
        success: true,
        message: 'Payment initialized successfully',
        payment: {
          id: payment._id,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          authorization_url: paystackResponse.data.data.authorization_url,
          access_code: paystackResponse.data.data.access_code
        }
      });
    }

    throw new Error('Failed to initialize payment with Paystack');
  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize payment', message: error.message });
  }
});

// -------------------------
// Verify Payment
// -------------------------
router.post('/verify/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ reference })
      .populate('booking')
      .populate('user', 'firstName lastName email');

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.paymentMethod !== 'cash') {
      const verificationResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );

      const verificationData = verificationResponse.data.data;

      if (verificationData.status === 'success') {
        await payment.markAsCompleted(verificationData.id, verificationData);

        if (payment.booking) {
          payment.booking.status = 'confirmed';
          payment.booking.paymentStatus = 'paid';
          await payment.booking.save();
        }
      } else {
        await payment.markAsFailed('Payment verification failed', verificationData);
      }
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify payment', message: error.message });
  }
});

// -------------------------
// Get User Payments
// -------------------------
router.get('/user', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (startDate || endDate) query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);

    const payments = await Payment.find(query)
      .populate('booking', 'testType referenceNumber scheduledDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    const stats = await Payment.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);

    const summary = { totalPayments: total, totalAmount: 0, completedPayments: 0, pendingPayments: 0, failedPayments: 0 };
    stats.forEach(stat => {
      summary.totalAmount += stat.totalAmount;
      if (stat._id === 'completed') summary.completedPayments = stat.count;
      if (stat._id === 'pending') summary.pendingPayments = stat.count;
      if (stat._id === 'failed') summary.failedPayments = stat.count;
    });

    res.json({ success: true, payments, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), totalItems: total, hasNext: page * limit < total, hasPrev: page > 1 }, summary });
  } catch (error) {
    console.error('Get user payments error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve payments', message: error.message });
  }
});

// -------------------------
// Get Payment by ID
// -------------------------
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id })
      .populate('booking')
      .populate('user', 'firstName lastName email phone');

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Get payment by ID error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve payment', message: error.message });
  }
});

// -------------------------
// Paystack Webhook
// -------------------------
router.post('/webhook/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    if (!signature || !verifyPaystackSignature(req.body, signature)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body);

    if (event.event === 'charge.success') {
      const { reference, id: transactionId } = event.data;
      const payment = await Payment.findOne({ reference });
      if (payment && payment.status !== 'completed') {
        await payment.markAsCompleted(transactionId, event.data);

        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.status = 'confirmed';
          booking.paymentStatus = 'paid';
          await booking.save();
        }
      }
    } else if (event.event === 'charge.failed') {
      const { reference } = event.data;
      const payment = await Payment.findOne({ reference });
      if (payment) await payment.markAsFailed('Payment failed', event.data);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Paystack webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
});

// -------------------------
// Get Public Key
// -------------------------
router.get('/config/public-key', (req, res) => {
  res.json({ publicKey: PAYSTACK_PUBLIC_KEY });
});

// -------------------------
// Export router correctly
// -------------------------
module.exports = router;
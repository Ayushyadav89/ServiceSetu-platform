// routes/paymentRoutes.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { protect } = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');
const router = express.Router();

/**
 * @desc    Create payment order (Razorpay-ready mock)
 * @route   POST /api/payments/create-order
 * @access  Private
 */
router.post('/create-order', protect, asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (booking.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  // PRODUCTION: Replace with Razorpay order creation
  // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  // const order = await razorpay.orders.create({ amount: booking.pricing.totalAmount * 100, currency: 'INR', receipt: booking.bookingId });

  const mockOrder = {
    orderId: `order_mock_${Date.now()}`,
    amount: booking.pricing.totalAmount * 100, // in paise
    currency: 'INR',
    bookingId: booking.bookingId,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  };

  res.json({ success: true, data: { order: mockOrder } });
}));

/**
 * @desc    Verify payment (Razorpay webhook / manual verify)
 * @route   POST /api/payments/verify
 * @access  Private
 */
router.post('/verify', protect, asyncHandler(async (req, res) => {
  const { bookingId, transactionId, paymentMethod } = req.body;
  const booking = await Booking.findById(bookingId);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  // PRODUCTION: Verify Razorpay signature here
  // const isValid = razorpay.validatePaymentVerification({ order_id, payment_id }, razorpay_signature, process.env.RAZORPAY_KEY_SECRET);

  booking.payment.status = 'paid';
  booking.payment.transactionId = transactionId || `txn_mock_${Date.now()}`;
  booking.payment.method = paymentMethod || 'upi';
  booking.payment.paidAt = new Date();
  await booking.save();

  res.json({ success: true, message: 'Payment verified successfully.', data: { booking } });
}));

module.exports = router;

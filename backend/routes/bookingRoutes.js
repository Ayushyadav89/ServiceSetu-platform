const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rateBooking,
  workerRespondToJob,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:id/rate', protect, rateBooking);

// Public endpoint - worker response (simulates IVR/SMS reply)
// Protected by phone number validation in controller
router.post('/:id/worker-response', workerRespondToJob);

module.exports = router;

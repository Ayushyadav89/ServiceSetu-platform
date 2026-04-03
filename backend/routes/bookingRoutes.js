const express = require('express');
const { getPricingPreview, createBooking, getMyBookings, getBookingById, cancelBooking, rateBooking, workerRespondToJob } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/pricing-preview', protect, getPricingPreview); // NEW
router.post('/',               protect, createBooking);
router.get('/',                protect, getMyBookings);
router.get('/:id',             protect, getBookingById);
router.put('/:id/cancel',      protect, cancelBooking);
router.post('/:id/rate',       protect, rateBooking);
router.post('/:id/worker-response', workerRespondToJob);

module.exports = router;
// routes/adminRoutes.js
const express = require('express');
const {
  getDashboardAnalytics,
  getAllBookings,
  assignWorker,
  updateBookingStatus,
  getAllWorkers,
  addWorker,
  updateWorker,
  deleteWorker,
  getAllCustomers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/analytics', getDashboardAnalytics);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/assign-worker', assignWorker);
router.put('/bookings/:id/status', updateBookingStatus);
router.get('/workers', getAllWorkers);
router.post('/workers', addWorker);
router.put('/workers/:id', updateWorker);
router.delete('/workers/:id', deleteWorker);
router.get('/customers', getAllCustomers);

module.exports = router;

const express = require('express');
const {
  getAvailableWorkers, getAreaCoverage, checkPincodeCoverage,
  getAreaSuggestions, workerRegister, workerLogin,
  getWorkerProfile, updateWorkerProfile, getWorkerBookings,
  getWorkerDashboardStats, getWorkerById, updateWorkerPricing,
} = require('../controllers/workerController');
const { protectWorker } = require('../middleware/workerAuthMiddleware');
const router = express.Router();

router.get('/available',       getAvailableWorkers);
router.get('/coverage',        getAreaCoverage);
router.get('/check-coverage',  checkPincodeCoverage);
router.get('/suggestions',     getAreaSuggestions);
router.post('/auth/register',  workerRegister);
router.post('/auth/login',     workerLogin);
router.get('/me',              protectWorker, getWorkerProfile);
router.put('/me',              protectWorker, updateWorkerProfile);
router.put('/me/pricing',      protectWorker, updateWorkerPricing);
router.get('/me/bookings',     protectWorker, getWorkerBookings);
router.get('/me/stats',        protectWorker, getWorkerDashboardStats);
router.get('/:id',             getWorkerById);

module.exports = router;
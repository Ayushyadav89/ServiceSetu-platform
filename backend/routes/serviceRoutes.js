// routes/serviceRoutes.js
const express = require('express');
const { getServices, getServiceBySlug, createService, updateService, getServiceCategories } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getServices);
router.get('/categories', getServiceCategories);
router.get('/:slug', getServiceBySlug);
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);

module.exports = router;

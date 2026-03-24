const Service = require('../models/Service');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get all active services
 * @route   GET /api/services
 * @access  Public
 */
const getServices = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const query = { isActive: true };

  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: 'i' };

  const services = await Service.find(query).sort({ popularity: -1, name: 1 });
  res.json({ success: true, data: { services } });
});

/**
 * @desc    Get single service
 * @route   GET /api/services/:slug
 * @access  Public
 */
const getServiceBySlug = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug, isActive: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  res.json({ success: true, data: { service } });
});

/**
 * @desc    Create service (Admin)
 * @route   POST /api/services
 * @access  Private (Admin)
 */
const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, message: 'Service created.', data: { service } });
});

/**
 * @desc    Update service (Admin)
 * @route   PUT /api/services/:id
 * @access  Private (Admin)
 */
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  res.json({ success: true, message: 'Service updated.', data: { service } });
});

/**
 * @desc    Get services grouped by category (for homepage)
 * @route   GET /api/services/categories
 * @access  Public
 */
const getServiceCategories = asyncHandler(async (req, res) => {
  const categories = await Service.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        icon: { $first: '$icon' },
        startingPrice: { $min: '$basePrice' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: { categories } });
});

module.exports = { getServices, getServiceBySlug, createService, updateService, getServiceCategories };

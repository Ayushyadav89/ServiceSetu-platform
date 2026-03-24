const Worker = require('../models/Worker');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Find available workers by location + skill (geolocation matching)
 * @route   GET /api/workers/available
 * @access  Public
 */
const getAvailableWorkers = asyncHandler(async (req, res) => {
  const { skill, pincode, city } = req.query;
  const query = { isActive: true, availability: 'available' };

  if (skill) query.skills = skill;

  // Pincode-based matching (primary)
  if (pincode) {
    query['location.pincode'] = pincode;
  } else if (city) {
    // Fallback: city-level matching
    query['location.city'] = new RegExp(city, 'i');
  }

  const workers = await Worker.find(query)
    .select('name skills rating location availability experience')
    .sort({ 'rating.average': -1, totalJobsCompleted: -1 })
    .limit(10);

  res.json({
    success: true,
    data: { workers, count: workers.length },
  });
});

/**
 * @desc    Get worker public profile
 * @route   GET /api/workers/:id
 * @access  Public
 */
const getWorkerById = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id).select(
    'name skills rating location availability experience totalJobsCompleted'
  );
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });
  res.json({ success: true, data: { worker } });
});

module.exports = { getAvailableWorkers, getWorkerById };

const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ─── Generate JWT for worker ────────────────────────────────────────────────
const generateWorkerToken = (workerId) =>
  jwt.sign({ id: workerId, type: 'worker' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── PUBLIC: Search workers by area / city / skill ──────────────────────────
/**
 * @route GET /api/workers/available
 * @query area, city, skill, pincode
 * Tries: pincode → area → city (fallback chain)
 */
const getAvailableWorkers = asyncHandler(async (req, res) => {
  const { skill, pincode, area, city } = req.query;
  const baseQuery = { isActive: true };
  if (skill) baseQuery.skills = skill;

  let workers = [];
  let matchType = 'none';

  // 1. Pincode exact match
  if (pincode) {
    workers = await Worker.find({ ...baseQuery, 'location.pincode': pincode })
      .select('name skills rating location availability experience totalJobsCompleted bio workingHours')
      .sort({ 'rating.average': -1, totalJobsCompleted: -1 });
    if (workers.length) matchType = 'pincode';
  }

  // 2. Area name match (primary new path)
  if (!workers.length && area) {
    workers = await Worker.find({
      ...baseQuery,
      'location.area': new RegExp(area.trim(), 'i'),
      ...(city ? { 'location.city': new RegExp(city.trim(), 'i') } : {}),
    })
      .select('name skills rating location availability experience totalJobsCompleted bio workingHours')
      .sort({ 'rating.average': -1, totalJobsCompleted: -1 });
    if (workers.length) matchType = 'area';
  }

  // 3. City-only fallback
  if (!workers.length && city) {
    workers = await Worker.find({
      ...baseQuery,
      'location.city': new RegExp(city.trim(), 'i'),
    })
      .select('name skills rating location availability experience totalJobsCompleted bio workingHours')
      .sort({ 'rating.average': -1, totalJobsCompleted: -1 })
      .limit(15);
    if (workers.length) matchType = 'city';
  }

  const available = workers.filter((w) => w.availability === 'available');
  const busy      = workers.filter((w) => w.availability === 'busy');

  res.json({
    success: true,
    data: { workers, available, busy, count: workers.length, availableCount: available.length, matchType },
  });
});

// ─── PUBLIC: Coverage map by city ───────────────────────────────────────────
const getAreaCoverage = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const matchStage = { isActive: true };
  if (city) matchStage['location.city'] = new RegExp(city, 'i');

  const coverage = await Worker.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { pincode: '$location.pincode', area: '$location.area', city: '$location.city' },
        totalWorkers:     { $sum: 1 },
        availableWorkers: { $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] } },
        busyWorkers:      { $sum: { $cond: [{ $eq: ['$availability', 'busy'] }, 1, 0] } },
        skills:    { $push: '$skills' },
        avgRating: { $avg: '$rating.average' },
      },
    },
    {
      $project: {
        _id: 0,
        pincode: '$_id.pincode', area: '$_id.area', city: '$_id.city',
        totalWorkers: 1, availableWorkers: 1, busyWorkers: 1,
        avgRating: { $round: ['$avgRating', 1] },
        skills: { $reduce: { input: '$skills', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } },
        status: {
          $switch: {
            branches: [
              { case: { $eq: ['$availableWorkers', 0] }, then: 'unavailable' },
              { case: { $lte: ['$availableWorkers', 2] }, then: 'limited' },
            ],
            default: 'available',
          },
        },
      },
    },
    { $sort: { availableWorkers: -1, area: 1 } },
  ]);

  res.json({ success: true, data: { coverage, total: coverage.length } });
});

// ─── PUBLIC: Check pincode coverage ─────────────────────────────────────────
const checkPincodeCoverage = asyncHandler(async (req, res) => {
  const { pincode, skill } = req.query;
  if (!pincode) return res.status(400).json({ success: false, message: 'Pincode is required.' });

  const query = { isActive: true, 'location.pincode': pincode };
  if (skill) query.skills = skill;

  const [total, available] = await Promise.all([
    Worker.countDocuments(query),
    Worker.countDocuments({ ...query, availability: 'available' }),
  ]);

  let nearbyAreas = [];
  if (total === 0) {
    const zone = pincode.substring(0, 3);
    const nearby = await Worker.find({ isActive: true }).select('location.area location.city location.pincode').limit(100);
    nearbyAreas = [...new Set(
      nearby.filter((w) => w.location.pincode.startsWith(zone))
            .map((w) => `${w.location.area}, ${w.location.city}`)
    )].slice(0, 3);
  }

  res.json({
    success: true,
    data: {
      pincode, skill: skill || 'all', covered: total > 0,
      totalWorkers: total, availableNow: available, nearbyAreas,
      message: total === 0
        ? `No workers in pincode ${pincode}. Try nearby areas.`
        : available === 0
        ? `${total} worker(s) registered but all are currently busy.`
        : `${available} worker(s) available now in your area!`,
    },
  });
});

// ─── PUBLIC: Get all distinct areas/cities (for autocomplete) ───────────────
const getAreaSuggestions = asyncHandler(async (req, res) => {
  const { q, type } = req.query; // type: 'area' | 'city'

  const field = type === 'city' ? 'location.city' : 'location.area';
  const matchQuery = { isActive: true };
  if (q) matchQuery[field] = new RegExp(q.trim(), 'i');

  const results = await Worker.distinct(field, matchQuery);
  const sorted = results
    .filter(Boolean)
    .filter((r) => !q || r.toLowerCase().includes(q.toLowerCase()))
    .sort()
    .slice(0, 10);

  res.json({ success: true, data: { suggestions: sorted } });
});

// ─── WORKER AUTH: Self-register ──────────────────────────────────────────────
const workerRegister = asyncHandler(async (req, res) => {
  const { name, phone, email, password, skills, experience, location, bio, workingHours } = req.body;

  if (!name || !phone || !email || !password || !skills?.length || !location?.area || !location?.city || !location?.pincode) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  const existing = await Worker.findOne({ $or: [{ phone }, { email }] });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: existing.phone === phone ? 'Phone number already registered.' : 'Email already registered.',
    });
  }

  const worker = await Worker.create({
    name, phone, email, password, skills, experience: experience || 0,
    location, bio: bio || '', workingHours,
    isSelfRegistered: true,
    isProfileComplete: true,
    availability: 'available',
  });

  const token = generateWorkerToken(worker._id);
  res.status(201).json({
    success: true,
    message: 'Profile created successfully! You are now visible to customers.',
    data: { worker, token },
  });
});

// ─── WORKER AUTH: Login ──────────────────────────────────────────────────────
const workerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const worker = await Worker.findOne({ email, isSelfRegistered: true }).select('+password');
  if (!worker) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  if (!worker.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

  const isMatch = await worker.comparePassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  const token = generateWorkerToken(worker._id);
  res.json({ success: true, message: 'Login successful!', data: { worker, token } });
});

// ─── WORKER: Get own profile ─────────────────────────────────────────────────
const getWorkerProfile = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.worker._id);
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });
  res.json({ success: true, data: { worker } });
});

// ─── WORKER: Update own profile ──────────────────────────────────────────────
const updateWorkerProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'skills', 'experience', 'location', 'workingHours', 'availability'];
  const updates = {};
  allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

  const worker = await Worker.findByIdAndUpdate(req.worker._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated successfully.', data: { worker } });
});

// ─── WORKER: Get own bookings ────────────────────────────────────────────────
const getWorkerBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { worker: req.worker._id };
  if (status) query.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('service', 'name icon category basePrice')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Booking.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { bookings, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
  });
});

// ─── WORKER: Dashboard stats ─────────────────────────────────────────────────
const getWorkerDashboardStats = asyncHandler(async (req, res) => {
  const workerId = req.worker._id;

  const [total, completed, pending, confirmed, earnings] = await Promise.all([
    Booking.countDocuments({ worker: workerId }),
    Booking.countDocuments({ worker: workerId, status: 'completed' }),
    Booking.countDocuments({ worker: workerId, status: 'pending' }),
    Booking.countDocuments({ worker: workerId, status: 'confirmed' }),
    Booking.aggregate([
      { $match: { worker: workerId, status: 'completed', 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ]),
  ]);

  const worker = await Worker.findById(workerId);

  res.json({
    success: true,
    data: {
      stats: {
        totalBookings: total,
        completed, pending, confirmed,
        totalEarnings: earnings[0]?.total || 0,
        rating: worker.rating,
        availability: worker.availability,
      },
    },
  });
});

// ─── PUBLIC: Get single worker profile ──────────────────────────────────────
const getWorkerById = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id)
    .select('name skills rating location availability experience totalJobsCompleted bio workingHours isSelfRegistered');
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });
  res.json({ success: true, data: { worker } });
});

module.exports = {
  getAvailableWorkers,
  getAreaCoverage,
  checkPincodeCoverage,
  getAreaSuggestions,
  workerRegister,
  workerLogin,
  getWorkerProfile,
  updateWorkerProfile,
  getWorkerBookings,
  getWorkerDashboardStats,
  getWorkerById,
};
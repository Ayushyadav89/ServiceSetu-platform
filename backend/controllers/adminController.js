const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const User = require('../models/User');
const Service = require('../models/Service');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendSMSNotification } = require('../utils/notificationService');

/**
 * @desc    Admin dashboard analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin)
 */
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalBookings,
    monthBookings,
    lastMonthBookings,
    pendingBookings,
    completedBookings,
    totalWorkers,
    availableWorkers,
    totalCustomers,
    revenueData,
    bookingsByStatus,
    topServices,
    recentBookings,
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'completed' }),
    Worker.countDocuments({ isActive: true }),
    Worker.countDocuments({ availability: 'available', isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Booking.aggregate([
      { $match: { status: 'completed', 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ]),
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $project: { name: '$service.name', icon: '$service.icon', count: 1 } },
    ]),
    Booking.find()
      .populate('customer', 'name email')
      .populate('service', 'name icon')
      .populate('worker', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const totalRevenue = revenueData[0]?.total || 0;
  const bookingGrowth = lastMonthBookings === 0
    ? 100
    : Math.round(((monthBookings - lastMonthBookings) / lastMonthBookings) * 100);

  res.json({
    success: true,
    data: {
      stats: {
        totalBookings,
        monthBookings,
        bookingGrowth,
        pendingBookings,
        completedBookings,
        totalWorkers,
        availableWorkers,
        totalCustomers,
        totalRevenue,
      },
      bookingsByStatus,
      topServices,
      recentBookings,
    },
  });
});

/**
 * @desc    Get all bookings (Admin view with filters)
 * @route   GET /api/admin/bookings
 * @access  Private (Admin)
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search, dateFrom, dateTo } = req.query;
  const query = {};

  if (status) query.status = status;
  if (dateFrom || dateTo) {
    query.scheduledDate = {};
    if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom);
    if (dateTo) query.scheduledDate.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('service', 'name category icon')
      .populate('worker', 'name phone skills')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    },
  });
});

/**
 * @desc    Manually assign a worker to a booking
 * @route   PUT /api/admin/bookings/:id/assign-worker
 * @access  Private (Admin)
 */
const assignWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  const worker = await Worker.findById(workerId);
  if (!worker || !worker.isActive) {
    return res.status(404).json({ success: false, message: 'Worker not found or inactive.' });
  }

  // Free old worker if any
  if (booking.worker && booking.worker.toString() !== workerId) {
    await Worker.findByIdAndUpdate(booking.worker, { availability: 'available' });
  }

  booking.worker = workerId;
  booking.status = 'assigned';
  booking.workerResponse = { action: 'pending' };
  booking.statusHistory.push({
    status: 'assigned',
    changedBy: 'admin',
    note: `Manually assigned to ${worker.name}`,
  });

  worker.availability = 'busy';
  await worker.save();
  await booking.save();

  // Notify worker via SMS
  const message = `New Job Assigned! ServiceSetu: ${booking.bookingId}. Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')} at ${booking.scheduledTime}. Area: ${booking.address.area}. Call 1800-XXX-XXXX to accept.`;
  await sendSMSNotification(worker.phone, message, 'sms', worker._id);

  const updated = await Booking.findById(booking._id)
    .populate('service', 'name icon')
    .populate('worker', 'name phone');

  res.json({ success: true, message: `Booking assigned to ${worker.name}. SMS notification sent.`, data: { booking: updated } });
});

/**
 * @desc    Update booking status (Admin)
 * @route   PUT /api/admin/bookings/:id/status
 * @access  Private (Admin)
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['pending', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  booking.status = status;
  booking.statusHistory.push({ status, changedBy: 'admin', note: note || `Status updated to ${status}` });

  if (status === 'completed') {
    booking.completedAt = new Date();
    if (booking.worker) {
      await Worker.findByIdAndUpdate(booking.worker, {
        availability: 'available',
        $inc: { totalJobsCompleted: 1 },
      });
    }
  }

  if (status === 'cancelled') {
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'admin';
    if (booking.worker) {
      await Worker.findByIdAndUpdate(booking.worker, { availability: 'available' });
    }
  }

  await booking.save();
  res.json({ success: true, message: 'Booking status updated.', data: { booking } });
});

/**
 * @desc    Get all workers
 * @route   GET /api/admin/workers
 * @access  Private (Admin)
 */
const getAllWorkers = asyncHandler(async (req, res) => {
  const { skill, availability, area, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };

  if (skill) query.skills = skill;
  if (availability) query.availability = availability;
  if (area) query['location.area'] = new RegExp(area, 'i');

  const skip = (page - 1) * limit;
  const [workers, total] = await Promise.all([
    Worker.find(query)
      .populate('registeredBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Worker.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { workers, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
  });
});

/**
 * @desc    Add a new worker (Admin only - workers don't self-register)
 * @route   POST /api/admin/workers
 * @access  Private (Admin)
 */
const addWorker = asyncHandler(async (req, res) => {
  const { name, phone, skills, experience, location } = req.body;

  const existing = await Worker.findOne({ phone });
  if (existing) return res.status(409).json({ success: false, message: 'Worker with this phone number already exists.' });

  const worker = await Worker.create({
    name,
    phone,
    skills,
    experience,
    location,
    registeredBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Worker registered successfully!', data: { worker } });
});

/**
 * @desc    Update a worker
 * @route   PUT /api/admin/workers/:id
 * @access  Private (Admin)
 */
const updateWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });

  res.json({ success: true, message: 'Worker updated successfully.', data: { worker } });
});

/**
 * @desc    Delete (deactivate) a worker
 * @route   DELETE /api/admin/workers/:id
 * @access  Private (Admin)
 */
const deleteWorker = asyncHandler(async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found.' });
  res.json({ success: true, message: 'Worker deactivated successfully.' });
});

/**
 * @desc    Get all customers
 * @route   GET /api/admin/customers
 * @access  Private (Admin)
 */
const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    User.find({ role: 'customer' }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments({ role: 'customer' }),
  ]);

  res.json({
    success: true,
    data: { customers, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
  });
});

module.exports = {
  getDashboardAnalytics,
  getAllBookings,
  assignWorker,
  updateBookingStatus,
  getAllWorkers,
  addWorker,
  updateWorker,
  deleteWorker,
  getAllCustomers,
};

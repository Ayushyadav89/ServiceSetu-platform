const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Worker = require('../models/Worker');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendSMSNotification } = require('../utils/notificationService');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private (Customer)
 */
const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, scheduledDate, scheduledTime, address, customerNotes, paymentMethod } = req.body;

  // Validate service exists
  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    return res.status(404).json({ success: false, message: 'Service not found or unavailable.' });
  }

  // Calculate pricing (18% GST)
  const baseAmount = service.basePrice;
  const taxAmount = Math.round(baseAmount * 0.18);
  const totalAmount = baseAmount + taxAmount;

  const booking = await Booking.create({
    customer: req.user._id,
    service: serviceId,
    scheduledDate: new Date(scheduledDate),
    scheduledTime,
    address,
    customerNotes,
    pricing: { baseAmount, taxAmount, totalAmount },
    payment: { method: paymentMethod || 'pending', status: 'unpaid' },
    statusHistory: [{ status: 'pending', changedBy: 'customer', note: 'Booking created' }],
  });

  // Attempt auto-assignment of nearest available worker
  const autoAssigned = await autoAssignWorker(booking, service.category);

  const populatedBooking = await Booking.findById(booking._id)
    .populate('service', 'name category icon basePrice priceUnit')
    .populate('worker', 'name phone skills rating');

  res.status(201).json({
    success: true,
    message: autoAssigned
      ? 'Booking confirmed! A worker has been assigned.'
      : 'Booking received! We will assign a worker shortly.',
    data: { booking: populatedBooking },
  });
});

/**
 * Auto-assign the nearest available worker by pincode + skill
 */
const autoAssignWorker = async (booking, skillRequired) => {
  try {
    // Find available workers in the same pincode area
    const worker = await Worker.findOne({
      skills: skillRequired,
      availability: 'available',
      isActive: true,
      'location.pincode': booking.address.pincode,
    }).sort({ 'rating.average': -1 }); // Prefer highest rated

    if (!worker) return false;

    // Assign worker
    booking.worker = worker._id;
    booking.status = 'assigned';
    booking.workerResponse = { action: 'pending', respondedAt: null };
    booking.statusHistory.push({
      status: 'assigned',
      changedBy: 'system',
      note: `Auto-assigned to ${worker.name}`,
    });

    // Update worker availability
    worker.availability = 'busy';
    await worker.save();
    await booking.save();

    // Send SMS notification to worker
    const message = `New Job! ServiceSetu: ${booking.bookingId}. Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')} at ${booking.scheduledTime}. Area: ${booking.address.area}. Reply 1 to Accept, 2 to Reject. Call 1800-XXX-XXXX`;
    await sendSMSNotification(worker.phone, message, 'sms', worker._id);

    return true;
  } catch (error) {
    console.error('Auto-assign error:', error.message);
    return false;
  }
};

/**
 * @desc    Get all bookings for logged-in customer
 * @route   GET /api/bookings
 * @access  Private (Customer)
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { customer: req.user._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('service', 'name category icon')
      .populate('worker', 'name phone rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit),
      },
    },
  });
});

/**
 * @desc    Get single booking details
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('service')
    .populate('worker', 'name phone skills rating location');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  // Customers can only view their own bookings
  if (req.user.role !== 'admin' && booking.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  res.json({ success: true, data: { booking } });
});

/**
 * @desc    Cancel a booking (customer)
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Customer)
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  if (booking.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  if (['completed', 'cancelled', 'in_progress'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
  }

  // Free up the worker if assigned
  if (booking.worker) {
    await Worker.findByIdAndUpdate(booking.worker, { availability: 'available' });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = 'customer';
  booking.cancellationReason = req.body.reason || 'Cancelled by customer';
  booking.statusHistory.push({ status: 'cancelled', changedBy: 'customer', note: booking.cancellationReason });

  await booking.save();
  res.json({ success: true, message: 'Booking cancelled successfully.', data: { booking } });
});

/**
 * @desc    Rate a completed booking
 * @route   POST /api/bookings/:id/rate
 * @access  Private (Customer)
 */
const rateBooking = asyncHandler(async (req, res) => {
  const { score, review } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'Only completed bookings can be rated.' });
  if (booking.rating?.score) return res.status(400).json({ success: false, message: 'Booking already rated.' });

  booking.rating = { score, review, ratedAt: new Date() };
  await booking.save();

  // Update worker's average rating
  if (booking.worker) {
    const worker = await Worker.findById(booking.worker);
    if (worker) {
      const newCount = worker.rating.count + 1;
      const newAverage = ((worker.rating.average * worker.rating.count) + score) / newCount;
      worker.rating = { count: newCount, average: Math.round(newAverage * 10) / 10 };
      await worker.save();
    }
  }

  res.json({ success: true, message: 'Thank you for your feedback!', data: { booking } });
});

/**
 * @desc    Worker responds to a job (Accept/Reject) - simulates IVR / SMS reply
 * @route   POST /api/bookings/:id/worker-response
 * @access  Public (worker webhook - validated by bookingId + phone)
 */
const workerRespondToJob = asyncHandler(async (req, res) => {
  const { action, phone, rejectionReason } = req.body; // action: 'accepted' | 'rejected'
  const booking = await Booking.findById(req.params.id).populate('worker');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (!booking.worker) return res.status(400).json({ success: false, message: 'No worker assigned to this booking.' });
  if (booking.worker.phone !== phone) return res.status(403).json({ success: false, message: 'Phone number mismatch.' });

  if (action === 'accepted') {
    booking.status = 'confirmed';
    booking.workerResponse = { action: 'accepted', respondedAt: new Date() };
    booking.statusHistory.push({ status: 'confirmed', changedBy: 'worker', note: 'Worker accepted the job' });
  } else if (action === 'rejected') {
    booking.status = 'pending';
    booking.workerResponse = { action: 'rejected', respondedAt: new Date(), rejectionReason };
    booking.statusHistory.push({ status: 'pending', changedBy: 'worker', note: `Worker rejected: ${rejectionReason || 'No reason given'}` });

    // Free the worker and try reassignment
    await Worker.findByIdAndUpdate(booking.worker._id, { availability: 'available' });
    booking.worker = null;
  }

  await booking.save();
  res.json({ success: true, message: `Job ${action} successfully.` });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rateBooking,
  workerRespondToJob,
};

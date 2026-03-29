const Booking  = require('../models/Booking');
const Service  = require('../models/Service');
const Worker   = require('../models/Worker');
const { asyncHandler }      = require('../middleware/errorMiddleware');
const { sendSMSNotification } = require('../utils/notificationService');
const { calculatePricing }  = require('../utils/pricingEngine');

/**
 * @desc  Get full pricing preview for a service + optional worker
 * @route GET /api/bookings/pricing-preview?serviceId=xxx&workerId=yyy
 */
const getPricingPreview = asyncHandler(async (req, res) => {
  const { serviceId, workerId } = req.query;

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

  let workerPrice = service.basePrice;
  let worker = null;

  if (workerId) {
    worker = await Worker.findById(workerId).select('name skills rating location availability pricing');
    if (worker?.pricing?.demandedPrice) {
      workerPrice = worker.pricing.demandedPrice;
    }
  }

  const pricing = calculatePricing(workerPrice);

  res.json({
    success: true,
    data: {
      service: { name: service.name, icon: service.icon, priceUnit: service.priceUnit },
      worker:  worker ? { name: worker.name, area: worker.location.area, city: worker.location.city, rating: worker.rating } : null,
      pricing,
    },
  });
});

/**
 * @desc  Create booking with transparent pricing
 * @route POST /api/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, workerId, scheduledDate, scheduledTime, address, customerNotes, paymentMethod } = req.body;

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    return res.status(404).json({ success: false, message: 'Service not found or unavailable.' });
  }

  // Determine worker price
  let workerPrice = service.basePrice;
  let assignedWorker = null;

  if (workerId) {
    assignedWorker = await Worker.findById(workerId);
    if (assignedWorker?.pricing?.demandedPrice) {
      workerPrice = assignedWorker.pricing.demandedPrice;
    }
  }

  const pricing = calculatePricing(workerPrice);

  const booking = await Booking.create({
    customer: req.user._id,
    service:  serviceId,
    worker:   workerId || null,
    scheduledDate: new Date(scheduledDate),
    scheduledTime,
    address,
    customerNotes,
    pricing: {
      workerPrice:     pricing.workerPrice,
      serviceFee:      pricing.serviceFee,
      maintenanceFee:  pricing.maintenanceFee,
      baseAmount:      pricing.workerPrice,
      taxAmount:       pricing.gstAmount,
      totalAmount:     pricing.totalAmount,
    },
    payment: { method: paymentMethod || 'pending', status: 'unpaid' },
    statusHistory: [{ status: 'pending', changedBy: 'customer', note: 'Booking created' }],
  });

  // If worker was pre-selected, assign directly; else auto-assign
  let autoAssigned = false;
  if (workerId && assignedWorker) {
    assignedWorker.availability = 'busy';
    await assignedWorker.save();
    booking.status = 'assigned';
    booking.workerResponse = { action: 'pending' };
    booking.statusHistory.push({ status: 'assigned', changedBy: 'customer', note: `Worker ${assignedWorker.name} selected by customer` });
    await booking.save();
    const msg = `New Job! ServiceSetu: ${booking.bookingId}. Date: ${new Date(scheduledDate).toLocaleDateString('en-IN')} at ${scheduledTime}. Area: ${address.area}. Reply 1-Accept 2-Reject.`;
    await sendSMSNotification(assignedWorker.phone, msg, 'sms', assignedWorker._id);
    autoAssigned = true;
  } else {
    autoAssigned = await autoAssignWorker(booking, service.category);
  }

  const populated = await Booking.findById(booking._id)
    .populate('service', 'name category icon basePrice priceUnit')
    .populate('worker', 'name phone skills rating location');

  res.status(201).json({
    success: true,
    message: autoAssigned ? 'Booking confirmed! A worker has been assigned.' : 'Booking received! We will assign a worker shortly.',
    data: { booking: populated },
  });
});

const autoAssignWorker = async (booking, skillRequired) => {
  try {
    const worker = await Worker.findOne({
      skills: skillRequired, availability: 'available', isActive: true,
      'location.pincode': booking.address.pincode,
    }).sort({ 'rating.average': -1 });

    if (!worker) return false;

    booking.worker = worker._id;
    booking.status = 'assigned';
    booking.workerResponse = { action: 'pending' };
    booking.statusHistory.push({ status: 'assigned', changedBy: 'system', note: `Auto-assigned to ${worker.name}` });
    worker.availability = 'busy';
    await worker.save();
    await booking.save();

    const msg = `New Job! ServiceSetu: ${booking.bookingId}. Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')} at ${booking.scheduledTime}. Area: ${booking.address.area}.`;
    await sendSMSNotification(worker.phone, msg, 'sms', worker._id);
    return true;
  } catch (e) { console.error('Auto-assign error:', e.message); return false; }
};

const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { customer: req.user._id };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(query).populate('service','name category icon').populate('worker','name phone rating').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Booking.countDocuments(query),
  ]);
  res.json({ success: true, data: { bookings, pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) } } });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('service').populate('worker','name phone skills rating location');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (req.user.role !== 'admin' && booking.customer.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: 'Access denied.' });
  res.json({ success: true, data: { booking } });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (booking.customer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Access denied.' });
  if (['completed','cancelled','in_progress'].includes(booking.status))
    return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
  if (booking.worker) await Worker.findByIdAndUpdate(booking.worker, { availability: 'available' });
  booking.status = 'cancelled';
  booking.cancelledAt = new Date(); booking.cancelledBy = 'customer';
  booking.cancellationReason = req.body.reason || 'Cancelled by customer';
  booking.statusHistory.push({ status: 'cancelled', changedBy: 'customer', note: booking.cancellationReason });
  await booking.save();
  res.json({ success: true, message: 'Booking cancelled.', data: { booking } });
});

const rateBooking = asyncHandler(async (req, res) => {
  const { score, review } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'Only completed bookings can be rated.' });
  if (booking.rating?.score) return res.status(400).json({ success: false, message: 'Already rated.' });
  booking.rating = { score, review, ratedAt: new Date() };
  await booking.save();
  if (booking.worker) {
    const worker = await Worker.findById(booking.worker);
    if (worker) {
      const newCount = worker.rating.count + 1;
      worker.rating = { count: newCount, average: Math.round(((worker.rating.average * worker.rating.count) + score) / newCount * 10) / 10 };
      await worker.save();
    }
  }
  res.json({ success: true, message: 'Thanks for your feedback!', data: { booking } });
});

const workerRespondToJob = asyncHandler(async (req, res) => {
  const { action, phone, rejectionReason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('worker');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (!booking.worker) return res.status(400).json({ success: false, message: 'No worker assigned.' });
  if (booking.worker.phone !== phone) return res.status(403).json({ success: false, message: 'Phone mismatch.' });
  if (action === 'accepted') {
    booking.status = 'confirmed';
    booking.workerResponse = { action: 'accepted', respondedAt: new Date() };
    booking.statusHistory.push({ status: 'confirmed', changedBy: 'worker', note: 'Worker accepted' });
  } else {
    booking.status = 'pending';
    booking.workerResponse = { action: 'rejected', respondedAt: new Date(), rejectionReason };
    booking.statusHistory.push({ status: 'pending', changedBy: 'worker', note: `Worker rejected: ${rejectionReason || ''}` });
    await Worker.findByIdAndUpdate(booking.worker._id, { availability: 'available' });
    booking.worker = null;
  }
  await booking.save();
  res.json({ success: true, message: `Job ${action}.` });
});

module.exports = { getPricingPreview, createBooking, getMyBookings, getBookingById, cancelBooking, rateBooking, workerRespondToJob };
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'pending',      
        'assigned',     
        'confirmed',    
        'in_progress',  
        'completed',    
        'cancelled',    
        'rejected',     
      ],
      default: 'pending',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
    },
    address: {
      street: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    pricing: {
      workerPrice:     { type: Number, default: 0 },   // worker's demanded price
      serviceFee:      { type: Number, default: 0 },   // 20% platform fee
      maintenanceFee:  { type: Number, default: 20 },  // fixed ₹20
      baseAmount:      { type: Number, required: true },
      taxAmount:       { type: Number, default: 0 },   // GST on platform charges
      discountAmount:  { type: Number, default: 0 },
      totalAmount:     { type: Number, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ['cash', 'upi', 'card', 'razorpay', 'pending'],
        default: 'pending',
      },
      status: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded', 'failed'],
        default: 'unpaid',
      },
      transactionId: String,
      paidAt: Date,
    },
    customerNotes: {
      type: String,
      maxlength: 500,
    },
    workerNotes: {
      type: String,
      maxlength: 500,
    },
    rating: {
      score: { type: Number, min: 1, max: 5 },
      review: String,
      ratedAt: Date,
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: String, 
        note: String,
      },
    ],
    workerResponse: {
      action: { type: String, enum: ['accepted', 'rejected', 'pending'], default: 'pending' },
      respondedAt: Date,
      rejectionReason: String,
    },
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: String,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Auto-generate booking ID before save
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9000) + 1000;
    this.bookingId = `SS${dateStr}${random}`;
  }
  next();
});

// Indexes
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ worker: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ 'address.pincode': 1 });

module.exports = mongoose.model('Booking', bookingSchema);
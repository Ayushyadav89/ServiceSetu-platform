const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    slug:             { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String, required: true,
      enum: ['plumber','electrician','carpenter','painter','laborer','cleaner','ac_technician','pest_control'],
    },
    description:      { type: String, required: true },
    shortDescription: { type: String, maxlength: 120 },
    basePrice: {
      type: Number, required: true, min: 0,
      // This is the MINIMUM / default worker price
    },
    priceUnit: {
      type: String,
      enum: ['per_hour', 'per_visit', 'per_day', 'fixed'],
      default: 'per_visit',
    },
    // Platform pricing config (can be overridden per service)
    pricing: {
      serviceFeePercent:  { type: Number, default: 0.20 }, // 20%
      maintenanceFee:     { type: Number, default: 20   }, // ₹20
      gstPercent:         { type: Number, default: 0.18 }, // 18%
      minWorkerPrice:     { type: Number, default: 0    }, // minimum a worker can charge
      maxWorkerPrice:     { type: Number, default: 5000 }, // maximum a worker can charge
    },
    estimatedDuration: { type: Number, default: 60 },
    icon:              { type: String, default: '🔧' },
    image:             { type: String, default: '' },
    isActive:          { type: Boolean, default: true },
    includes:          [String],
    excludes:          [String],
    tags:              [String],
    popularity:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'plumber',
        'electrician',
        'carpenter',
        'painter',
        'laborer',
        'cleaner',
        'ac_technician',
        'pest_control',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      maxlength: 120,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceUnit: {
      type: String,
      enum: ['per_hour', 'per_visit', 'per_day', 'fixed'],
      default: 'per_visit',
    },
    estimatedDuration: {
      type: Number, // in minutes
      default: 60,
    },
    icon: {
      type: String, // emoji or icon class
      default: '🔧',
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    includes: [String], // What's included in the service
    excludes: [String], // What's not included
    tags: [String],
    popularity: {
      type: Number,
      default: 0, // For sorting
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);

const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Worker name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
    },
    skills: [
      {
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
    ],
    experience: {
      type: Number, // years of experience
      default: 0,
      min: 0,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    location: {
      area: { type: String, required: true }, // Neighbourhood / locality
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Workers don't have a login – admin registers them
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin user
    },
    // Track notifications sent to worker
    notifications: [
      {
        message: String,
        type: { type: String, enum: ['sms', 'ivr', 'system'] },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
      },
    ],
    totalJobsCompleted: {
      type: Number,
      default: 0,
    },
    documents: {
      idProof: String, // Aadhaar / Voter ID (URL or flag)
      verified: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Index for geolocation queries
workerSchema.index({ 'location.pincode': 1, skills: 1, availability: 1 });

module.exports = mongoose.model('Worker', workerSchema);

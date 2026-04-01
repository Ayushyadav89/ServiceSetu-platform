const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workerSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true, match: [/^[6-9]\d{9}$/, 'Valid Indian phone required'] },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, select: false, minlength: 6 },
    isSelfRegistered: { type: Boolean, default: false },
    bio:   { type: String, maxlength: 300, default: '' },
    skills: [{
      type: String, required: true,
      enum: ['plumber','electrician','carpenter','painter','laborer','cleaner','ac_technician','pest_control'],
    }],
    experience: { type: Number, default: 0, min: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },
    location: {
      area:    { type: String, required: true },
      city:    { type: String, required: true },
      pincode: { type: String, required: true },
      state:   { type: String, default: 'Uttar Pradesh' },
      coordinates: { lat: Number, lng: Number },
    },
    // Worker's own price demands per skill
    pricing: {
      demandedPrice:  { type: Number, default: null }, // null = use service basePrice
      pricePerHour:   { type: Number, default: null },
      pricePerVisit:  { type: Number, default: null },
      pricePerDay:    { type: Number, default: null },
      note:           { type: String, default: '' },    // e.g. "Price may vary by job size"
    },
    availability: { type: String, enum: ['available','busy','offline'], default: 'available' },
    isActive:     { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notifications: [{
      message: String,
      type:    { type: String, enum: ['sms','ivr','system'] },
      sentAt:  { type: Date, default: Date.now },
      status:  { type: String, enum: ['sent','failed','pending'], default: 'pending' },
    }],
    totalJobsCompleted: { type: Number, default: 0 },
    documents: { idProof: String, verified: { type: Boolean, default: false } },
    workingHours: { start: { type: String, default: '08:00' }, end: { type: String, default: '20:00' } },
  },
  { timestamps: true }
);

workerSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
workerSchema.methods.comparePassword = async function (p) { return bcrypt.compare(p, this.password) };
workerSchema.methods.toJSON = function () { const o = this.toObject(); delete o.password; return o };

workerSchema.index({ 'location.pincode': 1, skills: 1, availability: 1 });
workerSchema.index({ 'location.area': 'text', 'location.city': 'text', name: 'text' });
workerSchema.index({ 'location.city': 1, 'location.area': 1 });

module.exports = mongoose.model('Worker', workerSchema);
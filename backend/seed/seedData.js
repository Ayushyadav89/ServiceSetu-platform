/**
 * ServiceSetu - Database Seed Script
 * Run: node seed/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Service = require('../models/Service');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI;

const services = [
  {
    name: 'Pipe Repair & Leakage Fix',
    slug: 'pipe-repair-leakage-fix',
    category: 'plumber',
    description: 'Expert plumbers for all kinds of pipe repairs, leakage fixes, drainage cleaning and tap replacements. Available same-day.',
    shortDescription: 'Fix leaks, pipes & drainage issues',
    basePrice: 299,
    priceUnit: 'per_visit',
    estimatedDuration: 60,
    icon: '🔧',
    includes: ['Labour charges', 'Basic inspection', 'Minor fitting'],
    excludes: ['Spare parts cost', 'Major excavation'],
    tags: ['plumbing', 'leak', 'pipe'],
    popularity: 95,
    isActive: true,
  },
  {
    name: 'Bathroom Fitting & Installation',
    slug: 'bathroom-fitting-installation',
    category: 'plumber',
    description: 'Complete bathroom fitting including geyser, shower, toilet installation by certified plumbers.',
    shortDescription: 'Geyser, shower & toilet installation',
    basePrice: 499,
    priceUnit: 'per_visit',
    estimatedDuration: 120,
    icon: '🚿',
    includes: ['Labour', 'Old fitting removal', 'Sealing'],
    excludes: ['New fittings cost'],
    tags: ['bathroom', 'fitting', 'geyser'],
    popularity: 78,
    isActive: true,
  },
  {
    name: 'Electrical Wiring & Repair',
    slug: 'electrical-wiring-repair',
    category: 'electrician',
    description: 'Certified electricians for wiring, switchboard repair, short circuit fixing and electrical safety checks.',
    shortDescription: 'Wiring, switches & electrical fixes',
    basePrice: 249,
    priceUnit: 'per_visit',
    estimatedDuration: 60,
    icon: '⚡',
    includes: ['Labour', 'Basic inspection', 'Safety check'],
    excludes: ['Wiring material cost', 'New MCB/fuse'],
    tags: ['electrical', 'wiring', 'switchboard'],
    popularity: 92,
    isActive: true,
  },
  {
    name: 'Fan & Light Installation',
    slug: 'fan-light-installation',
    category: 'electrician',
    description: 'Safe installation of ceiling fans, chandeliers, tube lights and LED panels by qualified electricians.',
    shortDescription: 'Fan, LED & light fixture installation',
    basePrice: 199,
    priceUnit: 'per_visit',
    estimatedDuration: 45,
    icon: '💡',
    includes: ['Installation', 'Testing', '1 fixture per visit'],
    excludes: ['Fixtures cost', 'Extra fixtures'],
    tags: ['fan', 'light', 'installation'],
    popularity: 88,
    isActive: true,
  },
  {
    name: 'Furniture Assembly & Repair',
    slug: 'furniture-assembly-repair',
    category: 'carpenter',
    description: 'Skilled carpenters for assembling flat-pack furniture, wardrobe installation, door repair and custom woodwork.',
    shortDescription: 'Furniture assembly, doors & woodwork',
    basePrice: 399,
    priceUnit: 'per_visit',
    estimatedDuration: 90,
    icon: '🪑',
    includes: ['Assembly labour', 'Basic tools', 'Screw tightening'],
    excludes: ['Wood material', 'Polish/paint'],
    tags: ['furniture', 'carpenter', 'wardrobe'],
    popularity: 80,
    isActive: true,
  },
  {
    name: 'Door & Window Repair',
    slug: 'door-window-repair',
    category: 'carpenter',
    description: 'Fix stuck doors, replace handles, repair window frames and hinges. Same-day service available.',
    shortDescription: 'Door, window & hinge repair',
    basePrice: 299,
    priceUnit: 'per_visit',
    estimatedDuration: 60,
    icon: '🚪',
    includes: ['Labour', 'Minor adjustments', 'Hinge oiling'],
    excludes: ['New hardware', 'Wood replacement'],
    tags: ['door', 'window', 'hinge'],
    popularity: 70,
    isActive: true,
  },
  {
    name: 'Interior Wall Painting',
    slug: 'interior-wall-painting',
    category: 'painter',
    description: 'Professional interior painting with premium emulsion or distemper paint. Clean, precise and fast execution.',
    shortDescription: 'Interior painting - rooms & walls',
    basePrice: 8,
    priceUnit: 'per_visit',
    estimatedDuration: 480,
    icon: '🎨',
    includes: ['Labour', 'Masking', 'One coat primer'],
    excludes: ['Paint material', 'Putty work'],
    tags: ['painting', 'interior', 'emulsion'],
    popularity: 75,
    isActive: true,
  },
  {
    name: 'Home Deep Cleaning',
    slug: 'home-deep-cleaning',
    category: 'cleaner',
    description: 'Thorough deep cleaning of your home including kitchen, bathrooms, floors and surfaces with professional-grade equipment.',
    shortDescription: 'Full home deep clean service',
    basePrice: 999,
    priceUnit: 'fixed',
    estimatedDuration: 240,
    icon: '🧹',
    includes: ['2 cleaners', 'Cleaning supplies', '1 BHK up to 4hrs'],
    excludes: ['Sofa dry-cleaning', 'Exterior windows'],
    tags: ['cleaning', 'deep clean', 'housekeeping'],
    popularity: 85,
    isActive: true,
  },
  {
    name: 'AC Service & Gas Refill',
    slug: 'ac-service-gas-refill',
    category: 'ac_technician',
    description: 'Complete AC servicing including filter cleaning, coil washing, gas top-up and performance check.',
    shortDescription: 'AC service, cleaning & gas refill',
    basePrice: 599,
    priceUnit: 'per_visit',
    estimatedDuration: 90,
    icon: '❄️',
    includes: ['Filter wash', 'Coil cleaning', 'Performance test'],
    excludes: ['Gas refill charges', 'Spare parts'],
    tags: ['AC', 'air conditioner', 'gas'],
    popularity: 82,
    isActive: true,
  },
  {
    name: 'General Labour & Loading',
    slug: 'general-labour-loading',
    category: 'laborer',
    description: 'Reliable daily wage labourers for shifting, loading, unloading, construction assistance and general tasks.',
    shortDescription: 'Labour for shifting, loading & misc work',
    basePrice: 450,
    priceUnit: 'per_day',
    estimatedDuration: 480,
    icon: '💪',
    includes: ['8hr shift', 'Manual work'],
    excludes: ['Specialised tools', 'Materials'],
    tags: ['labour', 'loading', 'shifting'],
    popularity: 65,
    isActive: true,
  },
];

const workers = [
  {
    name: 'Ramesh Kumar',
    phone: '9876543210',
    skills: ['plumber'],
    experience: 8,
    location: { area: 'Govind Nagar', city: 'Kanpur', pincode: '208006' },
    availability: 'available',
    rating: { average: 4.7, count: 134 },
    totalJobsCompleted: 134,
  },
  {
    name: 'Suresh Yadav',
    phone: '9876543211',
    skills: ['plumber', 'laborer'],
    experience: 5,
    location: { area: 'Kidwai Nagar', city: 'Kanpur', pincode: '208011' },
    availability: 'available',
    rating: { average: 4.3, count: 87 },
    totalJobsCompleted: 87,
  },
  {
    name: 'Anil Singh',
    phone: '9876543212',
    skills: ['electrician'],
    experience: 10,
    location: { area: 'Govind Nagar', city: 'Kanpur', pincode: '208006' },
    availability: 'available',
    rating: { average: 4.9, count: 201 },
    totalJobsCompleted: 201,
  },
  {
    name: 'Vijay Sharma',
    phone: '9876543213',
    skills: ['electrician', 'ac_technician'],
    experience: 6,
    location: { area: 'Shyam Nagar', city: 'Kanpur', pincode: '208013' },
    availability: 'available',
    rating: { average: 4.5, count: 112 },
    totalJobsCompleted: 112,
  },
  {
    name: 'Mohan Lal',
    phone: '9876543214',
    skills: ['carpenter'],
    experience: 15,
    location: { area: 'Arya Nagar', city: 'Kanpur', pincode: '208002' },
    availability: 'available',
    rating: { average: 4.8, count: 189 },
    totalJobsCompleted: 189,
  },
  {
    name: 'Deepak Verma',
    phone: '9876543215',
    skills: ['painter'],
    experience: 7,
    location: { area: 'Civil Lines', city: 'Kanpur', pincode: '208001' },
    availability: 'available',
    rating: { average: 4.6, count: 95 },
    totalJobsCompleted: 95,
  },
  {
    name: 'Santosh Gupta',
    phone: '9876543216',
    skills: ['cleaner'],
    experience: 3,
    location: { area: 'Kidwai Nagar', city: 'Kanpur', pincode: '208011' },
    availability: 'available',
    rating: { average: 4.2, count: 56 },
    totalJobsCompleted: 56,
  },
  {
    name: 'Rajesh Patel',
    phone: '9876543217',
    skills: ['ac_technician'],
    experience: 9,
    location: { area: 'Swaroop Nagar', city: 'Kanpur', pincode: '208002' },
    availability: 'available',
    rating: { average: 4.7, count: 143 },
    totalJobsCompleted: 143,
  },
  {
    name: 'Mukesh Tiwari',
    phone: '9876543218',
    skills: ['laborer'],
    experience: 4,
    location: { area: 'Govind Nagar', city: 'Kanpur', pincode: '208006' },
    availability: 'available',
    rating: { average: 4.0, count: 45 },
    totalJobsCompleted: 45,
  },
  {
    name: 'Prakash Joshi',
    phone: '9876543219',
    skills: ['plumber', 'electrician'],
    experience: 12,
    location: { area: 'Civil Lines', city: 'Kanpur', pincode: '208001' },
    availability: 'available',
    rating: { average: 4.8, count: 167 },
    totalJobsCompleted: 167,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Worker.deleteMany({}),
      Service.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
    const admin = await User.create({
      name: 'ServiceSetu Admin',
      email: process.env.ADMIN_EMAIL || 'admin@servicesetu.com',
      password: adminPassword,
      phone: '9000000000',
      role: 'admin',
    });
    console.log(`👤 Admin created: ${admin.email}`);

    // Create demo customer
    const custPassword = await bcrypt.hash('Demo@123', 12);
    await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: custPassword,
      phone: '9111111111',
      role: 'customer',
      address: {
        street: '12, Vikas Nagar',
        city: 'Kanpur',
        state: 'Uttar Pradesh',
        pincode: '208006',
      },
    });
    console.log('👤 Demo customer created: priya@example.com / Demo@123');

    // Create services
    const createdServices = await Service.insertMany(services);
    console.log(`🔧 ${createdServices.length} services created`);

    // Create workers (registeredBy admin)
    const workersWithAdmin = workers.map((w) => ({ ...w, registeredBy: admin._id }));
    const createdWorkers = await Worker.insertMany(workersWithAdmin);
    console.log(`👷 ${createdWorkers.length} workers created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('─────────────────────────────────────────');
    console.log('🔐 Admin Login:    admin@servicesetu.com / Admin@123');
    console.log('👤 Customer Login: priya@example.com / Demo@123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();

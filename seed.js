/**
 * Seed script — creates demo user + vehicle in MongoDB
 * Run once:  node seed.js
 */

const mongoose = require('mongoose');
const env = require('./config/env');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');

const DEMO_USER = {
  name: 'Demo Driver',
  email: 'demo@safedrivex.com',
  mobile: '9876543210',
  password: 'Demo@123',
  licenseNumber: 'GJ0120230001234',
  role: 'USER',
  safetyScore: 85,
  totalPoints: 1250,
  totalTrips: 47,
  safeTrips: 41,
  totalDistance: 832.5,
  achievements: [
    { name: 'First Trip', description: 'Completed your first trip' },
    { name: 'Speed Master', description: 'Maintained safe speed for 10 trips' },
    { name: 'Night Owl', description: 'Completed 5 night trips safely' },
  ],
};

const DEMO_VEHICLE = {
  vehicleNumber: 'GJ01AB1234',
  vehicleType: 'CAR',
  brand: 'Maruti',
  model: 'Swift',
  year: 2023,
  deviceId: 'SDX-DEMO-001',
};

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);
  console.log('Connected.\n');

  // Upsert user
  let user = await User.findOne({ email: DEMO_USER.email });
  if (user) {
    console.log(`User "${DEMO_USER.email}" already exists (id: ${user._id}). Updating…`);
    Object.assign(user, DEMO_USER);
    await user.save();
  } else {
    user = await User.create(DEMO_USER);
    console.log(`Created user "${DEMO_USER.email}" (id: ${user._id})`);
  }

  // Upsert vehicle
  let vehicle = await Vehicle.findOne({ vehicleNumber: DEMO_VEHICLE.vehicleNumber });
  if (vehicle) {
    console.log(`Vehicle "${DEMO_VEHICLE.vehicleNumber}" already exists (id: ${vehicle._id}). Updating…`);
    Object.assign(vehicle, DEMO_VEHICLE, { userId: user._id });
    await vehicle.save();
  } else {
    vehicle = await Vehicle.create({ ...DEMO_VEHICLE, userId: user._id });
    console.log(`Created vehicle "${DEMO_VEHICLE.vehicleNumber}" (id: ${vehicle._id})`);
  }

  // Link vehicle → user
  user.vehicleId = vehicle._id;
  await user.save();

  console.log('\n✅ Seed complete!');
  console.log(`   Email    : ${DEMO_USER.email}`);
  console.log(`   Password : ${DEMO_USER.password}`);
  console.log(`   Vehicle  : ${DEMO_VEHICLE.vehicleNumber}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

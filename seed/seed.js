const connectDB = require('../config/db');
const seedUsers = require('./userSeed');
const seedRewards = require('./rewardSeed');
const seedDrivingData = require('./drivingSeed');

const runSeed = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting database seeding...');

    await seedUsers();
    await seedRewards();
    await seedDrivingData();

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
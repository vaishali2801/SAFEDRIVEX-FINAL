const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    await User.deleteMany({});
    await Vehicle.deleteMany({});

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Demo@123', salt);
    const adminHashedPassword = await bcrypt.hash('Admin@123', salt);

    const demoUser = await User.create({
      name: 'Demo Driver',
      email: 'demo@safedrivex.com',
      mobile: '9876543210',
      password: hashedPassword,
      licenseNumber: 'GJ0120240001234',
      role: 'USER',
      totalPoints: 2450,
      safetyScore: 92,
      totalTrips: 45,
      safeTrips: 40,
      totalDistance: 1250.5,
      achievements: [
        { name: 'Safe Driver', description: 'Completed 10 safe trips', earnedAt: new Date('2026-01-15') },
        { name: 'Helmet Hero', description: 'Wore helmet for 50 consecutive trips', earnedAt: new Date('2026-02-20') },
        { name: 'Speed Master', description: 'Maintained speed limit for 30 trips', earnedAt: new Date('2026-03-10') },
      ],
    });

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@safedrivex.com',
      mobile: '9876543211',
      password: adminHashedPassword,
      licenseNumber: 'GJ0120240001235',
      role: 'ADMIN',
      totalPoints: 0,
      safetyScore: 85,
    });

    const demoVehicle = await Vehicle.create({
      userId: demoUser._id,
      vehicleNumber: 'GJ01AB1234',
      vehicleType: 'CAR',
      brand: 'Maruti Suzuki',
      model: 'Swift',
      year: 2022,
      deviceId: 'ESP32-001',
    });

    const adminVehicle = await Vehicle.create({
      userId: adminUser._id,
      vehicleNumber: 'GJ01CD5678',
      vehicleType: 'CAR',
      brand: 'Hyundai',
      model: 'Creta',
      year: 2023,
      deviceId: 'ESP32-002',
    });

    demoUser.vehicleId = demoVehicle._id;
    adminUser.vehicleId = adminVehicle._id;
    await demoUser.save();
    await adminUser.save();

    const additionalUsers = [];
    const cities = ['Bhavnagar', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'];
    const vehicleTypes = ['MOTORCYCLE', 'CAR', 'COMMERCIAL'];
    const brands = ['Hero', 'Honda', 'TVS', 'Bajaj', 'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra'];
    const models = ['Splendor', 'Activa', 'Jupiter', 'Pulsar', 'Swift', 'Creta', 'Nexon', 'XUV300'];

    for (let i = 0; i < 8; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const model = models[Math.floor(Math.random() * models.length)];

      const hashed = await bcrypt.hash('Demo@123', salt);

      const user = await User.create({
        name: `Driver ${i + 1}`,
        email: `driver${i + 1}@safedrivex.com`,
        mobile: `98765432${12 + i}`,
        password: hashed,
        licenseNumber: `GJ012024000${1236 + i}`,
        role: 'USER',
        totalPoints: Math.floor(Math.random() * 5000),
        safetyScore: 60 + Math.floor(Math.random() * 40),
        totalTrips: Math.floor(Math.random() * 50),
        safeTrips: Math.floor(Math.random() * 40),
        totalDistance: Math.floor(Math.random() * 2000),
        achievements: [],
      });

      const vehicle = await Vehicle.create({
        userId: user._id,
        vehicleNumber: `GJ${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        vehicleType: vType,
        brand,
        model,
        year: 2020 + Math.floor(Math.random() * 5),
        deviceId: `ESP32-${String(i + 3).padStart(3, '0')}`,
      });

      user.vehicleId = vehicle._id;
      await user.save();
      additionalUsers.push(user);
    }

    console.log('✓ Users and vehicles seeded');
    return { demoUser, adminUser, additionalUsers };
  } catch (error) {
    console.error('User seed error:', error);
    throw error;
  }
};

module.exports = seedUsers;
const DrivingSession = require('../models/DrivingSession');
const DrivingEvent = require('../models/DrivingEvent');
const Violation = require('../models/Violation');
const Alert = require('../models/Alert');
const SafetyScore = require('../models/SafetyScore');
const Emergency = require('../models/Emergency');
const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { SESSION_STATUS, SENSOR_TYPES, SENSOR_STATUS, VIOLATION_TYPES, ALERT_TYPES, ALERT_SEVERITY, DRIVING_EVENT_TYPES, DEVICE_TYPES } = require('../utils/constants');

const seedDrivingData = async () => {
  try {
    await DrivingSession.deleteMany({});
    await DrivingEvent.deleteMany({});
    await Violation.deleteMany({});
    await Alert.deleteMany({});
    await SafetyScore.deleteMany({});
    await Emergency.deleteMany({});
    await Sensor.deleteMany({});
    await Device.deleteMany({});

    const users = await User.find({ role: 'USER' });
    const demoUser = await User.findOne({ email: 'demo@safedrivex.com' });
    const vehicles = await Vehicle.find({ userId: { $in: users.map(u => u._id) } });

    const locations = [
      { coordinates: [72.1519, 21.7645], address: 'GEC Bhavnagar, Gujarat' },
      { coordinates: [72.1362, 21.7600], address: 'Bhavnagar City Center' },
      { coordinates: [72.5714, 23.0225], address: 'Ahmedabad, Gujarat' },
      { coordinates: [72.8311, 21.1702], address: 'Surat, Gujarat' },
      { coordinates: [73.2212, 22.3072], address: 'Vadodara, Gujarat' },
    ];

    for (const user of users) {
      const vehicle = vehicles.find(v => v.userId.toString() === user._id.toString());
      if (!vehicle) continue;

      const numSessions = Math.floor(Math.random() * 10) + 5;

      for (let i = 0; i < numSessions; i++) {
        const startDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + (20 + Math.random() * 60) * 60 * 1000);
        const distance = Math.round((5 + Math.random() * 50) * 100) / 100;
        const avgSpeed = Math.round((30 + Math.random() * 40) * 10) / 10;
        const maxSpeed = Math.round((avgSpeed + Math.random() * 30) * 10) / 10;
        const safetyScore = Math.max(30, Math.min(100, 85 + Math.floor(Math.random() * 20) - Math.floor(Math.random() * 15)));
        const pointsEarned = Math.floor(Math.random() * 200);
        const pointsDeducted = Math.floor(Math.random() * 100);

        const startLoc = locations[Math.floor(Math.random() * locations.length)];
        const endLoc = locations[Math.floor(Math.random() * locations.length)];

        const session = await DrivingSession.create({
          userId: user._id,
          vehicleId: vehicle._id,
          startTime: startDate,
          endTime: endDate,
          startLocation: startLoc,
          endLocation: endLoc,
          distance,
          averageSpeed: avgSpeed,
          maxSpeed,
          speedLimit: 60,
          safetyScore,
          pointsEarned,
          pointsDeducted,
          helmetCompliance: Math.random() > 0.1 ? 100 : 0,
          seatBeltCompliance: Math.random() > 0.1 ? 100 : 0,
          phoneUsage: Math.random() > 0.85 ? 1 : 0,
          harshBrakingCount: Math.floor(Math.random() * 3),
          rashDrivingCount: Math.floor(Math.random() * 2),
          drowsinessDetected: Math.random() > 0.95 ? 1 : 0,
          status: SESSION_STATUS.COMPLETED,
          route: Array.from({ length: 5 }, (_, idx) => ({
            coordinates: [
              startLoc.coordinates[0] + (Math.random() - 0.5) * 0.01,
              startLoc.coordinates[1] + (Math.random() - 0.5) * 0.01,
            ],
            timestamp: new Date(startDate.getTime() + idx * 5 * 60 * 1000),
            speed: Math.round((avgSpeed + (Math.random() - 0.5) * 20) * 10) / 10,
          })),
        });

        const violationTypes = Object.values(VIOLATION_TYPES);
        const numViolations = Math.floor(Math.random() * 3);
        const violations = [];

        for (let j = 0; j < numViolations; j++) {
          const vType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
          const violation = await Violation.create({
            userId: user._id,
            drivingSessionId: session._id,
            type: vType,
            severity: Math.random() > 0.5 ? 'WARNING' : 'CRITICAL',
            pointsDeducted: Math.floor(Math.random() * 100) + 20,
            scoreDeducted: Math.floor(Math.random() * 50) + 10,
            location: {
              coordinates: [
                startLoc.coordinates[0] + (Math.random() - 0.5) * 0.005,
                startLoc.coordinates[1] + (Math.random() - 0.5) * 0.005,
              ],
            },
            speed: Math.round((60 + Math.random() * 40) * 10) / 10,
            speedLimit: 60,
          });
          violations.push(violation._id);

          await Alert.create({
            userId: user._id,
            drivingSessionId: session._id,
            type: ALERT_TYPES[vType] || ALERT_TYPES.RASH_DRIVING,
            severity: Math.random() > 0.5 ? ALERT_SEVERITY.WARNING : ALERT_SEVERITY.CRITICAL,
            message: `Violation: ${vType}`,
            metadata: { violationId: violation._id },
          });
        }

        session.violations = violations;
        await session.save();

        const eventTypes = Object.values(DRIVING_EVENT_TYPES);
        for (let j = 0; j < 5; j++) {
          await DrivingEvent.create({
            userId: user._id,
            drivingSessionId: session._id,
            eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            pointsChange: Math.floor(Math.random() * 50) - 20,
            scoreChange: Math.floor(Math.random() * 20) - 10,
            location: {
              coordinates: [
                startLoc.coordinates[0] + (Math.random() - 0.5) * 0.005,
                startLoc.coordinates[1] + (Math.random() - 0.5) * 0.005,
              ],
            },
            timestamp: new Date(startDate.getTime() + Math.random() * (endDate - startDate)),
          });
        }

        for (let j = 0; j < 3; j++) {
          await SafetyScore.create({
            userId: user._id,
            drivingSessionId: session._id,
            score: Math.max(30, Math.min(100, 85 + Math.floor(Math.random() * 20) - Math.floor(Math.random() * 15))),
            previousScore: 85,
            change: Math.floor(Math.random() * 20) - 10,
            reason: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          });
        }
      }
    }

    if (demoUser) {
      const demoVehicle = await Vehicle.findOne({ userId: demoUser._id });
      if (demoVehicle) {
        const demoSessions = [
          {
            startTime: new Date('2026-08-20T08:00:00'),
            endTime: new Date('2026-08-20T08:45:00'),
            distance: 25.5,
            averageSpeed: 45,
            maxSpeed: 55,
            safetyScore: 92,
            pointsEarned: 150,
            pointsDeducted: 0,
            helmetCompliance: 100,
            seatBeltCompliance: 100,
            phoneUsage: 0,
            harshBrakingCount: 0,
            rashDrivingCount: 0,
            drowsinessDetected: 0,
          },
          {
            startTime: new Date('2026-08-21T09:00:00'),
            endTime: new Date('2026-08-21T09:30:00'),
            distance: 18.2,
            averageSpeed: 40,
            maxSpeed: 50,
            safetyScore: 88,
            pointsEarned: 100,
            pointsDeducted: 0,
            helmetCompliance: 100,
            seatBeltCompliance: 100,
            phoneUsage: 0,
            harshBrakingCount: 1,
            rashDrivingCount: 0,
            drowsinessDetected: 0,
          },
          {
            startTime: new Date('2026-08-22T07:30:00'),
            endTime: new Date('2026-08-22T08:15:00'),
            distance: 30.0,
            averageSpeed: 42,
            maxSpeed: 65,
            safetyScore: 75,
            pointsEarned: 80,
            pointsDeducted: 100,
            helmetCompliance: 100,
            seatBeltCompliance: 100,
            phoneUsage: 1,
            harshBrakingCount: 0,
            rashDrivingCount: 1,
            drowsinessDetected: 0,
          },
        ];

        for (const s of demoSessions) {
          const session = await DrivingSession.create({
            userId: demoUser._id,
            vehicleId: demoVehicle._id,
            startLocation: locations[0],
            endLocation: locations[1],
            speedLimit: 60,
            status: SESSION_STATUS.COMPLETED,
            ...s,
          });

          await DrivingEvent.create({
            userId: demoUser._id,
            drivingSessionId: session._id,
            eventType: DRIVING_EVENT_TYPES.SAFE_SPEED,
            pointsChange: 15,
            scoreChange: 15,
            location: { coordinates: locations[0].coordinates },
          });

          if (s.phoneUsage) {
            await DrivingEvent.create({
              userId: demoUser._id,
              drivingSessionId: session._id,
              eventType: DRIVING_EVENT_TYPES.PHONE_DETECTED,
              pointsChange: -100,
              scoreChange: -100,
              location: { coordinates: locations[0].coordinates },
            });
          }
        }
      }
    }

    for (const user of users) {
      const vehicle = vehicles.find(v => v.userId.toString() === user._id.toString());
      if (!vehicle) continue;

      const device = await Device.create({
        deviceId: vehicle.deviceId || `ESP32-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        userId: user._id,
        vehicleId: vehicle._id,
        name: 'SafeDriveX Sensor Unit',
        type: DEVICE_TYPES.ESP32,
        firmwareVersion: '1.0.0',
        status: SENSOR_STATUS.ONLINE,
        lastSeen: new Date(),
        location: { coordinates: locations[0].coordinates },
      });

      for (const type of Object.values(SENSOR_TYPES)) {
        await Sensor.create({
          deviceId: device.deviceId,
          userId: user._id,
          type,
          status: Math.random() > 0.1 ? SENSOR_STATUS.ONLINE : SENSOR_STATUS.OFFLINE,
          value: type === SENSOR_TYPES.GPS ? { latitude: 21.7645, longitude: 72.1519, speed: 45 } : Math.random() * 100,
          unit: type === SENSOR_TYPES.GPS ? 'km/h' : type === SENSOR_TYPES.ACCELEROMETER ? 'm/s²' : '%',
          lastUpdated: new Date(),
          batteryLevel: Math.floor(Math.random() * 40) + 60,
        });
      }
    }

    console.log('✓ Driving data seeded');
  } catch (error) {
    console.error('Driving seed error:', error);
    throw error;
  }
};

module.exports = seedDrivingData;
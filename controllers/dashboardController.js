const User = require('../models/User');
const DrivingSession = require('../models/DrivingSession');
const Alert = require('../models/Alert');
const Sensor = require('../models/Sensor');
const { successResponse, errorResponse } = require('../utils/response');
const { calculateWeeklyScore, calculateTripStats } = require('../utils/calculations');
const { SESSION_STATUS } = require('../utils/constants');

const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('vehicleId');
    if (!user) return errorResponse(res, 'User not found', null, 404);

    const activeSession = await DrivingSession.findOne({ userId: req.userId, status: SESSION_STATUS.ACTIVE })
      .populate('vehicleId')
      .populate('violations', 'type severity pointsDeducted');

    const recentAlerts = await Alert.find({ userId: req.userId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(5);

    const sessions = await DrivingSession.find({ userId: req.userId, status: SESSION_STATUS.COMPLETED })
      .sort({ startTime: -1 })
      .limit(7);

    const weeklyScore = calculateWeeklyScore(sessions);
    const drivingStats = calculateTripStats(sessions);

    const sensors = await Sensor.find({ userId: req.userId, isActive: true });

    let currentSpeed = 0;
    let speedLimit = 60;
    let helmetStatus = 'UNKNOWN';
    let phoneStatus = 'UNKNOWN';
    let seatBeltStatus = 'UNKNOWN';
    let brakeStatus = 'SAFE';
    let drowsinessStatus = 'SAFE';

    if (activeSession) {
      const latestRoute = activeSession.route[activeSession.route.length - 1];
      currentSpeed = latestRoute?.speed || 0;
      speedLimit = activeSession.speedLimit;
      helmetStatus = activeSession.helmetCompliance === 100 ? 'SAFE' : 'DANGER';
      seatBeltStatus = activeSession.seatBeltCompliance === 100 ? 'SAFE' : 'DANGER';
      phoneStatus = activeSession.phoneUsage > 0 ? 'DANGER' : 'SAFE';
      brakeStatus = activeSession.harshBrakingCount > 0 ? 'DANGER' : 'SAFE';
      drowsinessStatus = activeSession.drowsinessDetected > 0 ? 'DANGER' : 'SAFE';
    }

    const sensorStatus = {};
    sensors.forEach((s) => {
      sensorStatus[s.type] = {
        status: s.status,
        lastUpdated: s.lastUpdated,
        batteryLevel: s.batteryLevel,
        value: s.value,
      };
    });

    return successResponse(res, 'Dashboard fetched', {
      user: user.toJSON(),
      currentSpeed,
      speedLimit,
      helmetStatus,
      phoneStatus,
      seatBeltStatus,
      brakeStatus,
      drowsinessStatus,
      safetyScore: user.safetyScore,
      points: user.totalPoints,
      activeSession,
      recentAlerts,
      weeklyScore,
      drivingStats,
      sensorStatus,
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch dashboard', error);
  }
};

module.exports = {
  getDashboard,
};
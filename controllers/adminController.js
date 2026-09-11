const User = require('../models/User');
const DrivingSession = require('../models/DrivingSession');
const Violation = require('../models/Violation');
const Reward = require('../models/Reward');
const RewardRedemption = require('../models/RewardRedemption');
const Emergency = require('../models/Emergency');
const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const rewardService = require('../services/rewardService');
const { successResponse, errorResponse } = require('../utils/response');
const { VIOLATION_TYPES, EMERGENCY_TRIGGER_TYPES, SENSOR_TYPES } = require('../utils/constants');

const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTrips,
      safeTrips,
      totalViolations,
      avgSafetyScore,
      totalRewardsRedeemed,
    ] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'USER', isActive: true, lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      DrivingSession.countDocuments({ status: 'COMPLETED' }),
      DrivingSession.countDocuments({ status: 'COMPLETED', safetyScore: { $gte: 70 } }),
      Violation.countDocuments(),
      User.aggregate([{ $match: { role: 'USER' } }, { $group: { _id: null, avg: { $avg: '$safetyScore' } } }]),
      RewardRedemption.countDocuments({ status: 'APPROVED' }),
    ]);

    const violationDistribution = await Violation.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const violationMap = {};
    Object.values(VIOLATION_TYPES).forEach((type) => {
      violationMap[type] = 0;
    });
    violationDistribution.forEach((v) => {
      violationMap[v._id] = v.count;
    });

    return successResponse(res, 'Admin dashboard fetched', {
      totalUsers,
      activeUsers,
      totalTrips,
      safeTrips,
      totalViolations,
      averageSafetyScore: avgSafetyScore[0]?.avg ? Math.round(avgSafetyScore[0].avg) : 85,
      totalRewardsRedeemed,
      violationDistribution: violationMap,
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch admin dashboard', error);
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return successResponse(res, 'Users fetched', {
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch users', error);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('vehicleId');
    if (!user) return errorResponse(res, 'User not found', null, 404);
    return successResponse(res, 'User fetched', user);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch user', error);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return errorResponse(res, 'User not found', null, 404);
    return successResponse(res, 'User status updated', user);
  } catch (error) {
    return errorResponse(res, 'Failed to update user status', error);
  }
};

const getViolations = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, severity, userId, startDate, endDate } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const violations = await Violation.find(filter)
      .populate('userId', 'name email mobile')
      .populate('drivingSessionId', 'startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Violation.countDocuments(filter);

    return successResponse(res, 'Violations fetched', {
      violations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch violations', error);
  }
};

const getSensors = async (req, res) => {
  try {
    const sensors = await Sensor.find()
      .populate('userId', 'name email mobile')
      .sort({ lastUpdated: -1 });

    const sensorStatus = {};
    SENSOR_TYPES.forEach((type) => {
      sensorStatus[type] = sensors.filter((s) => s.type === type).map((s) => ({
        deviceId: s.deviceId,
        status: s.status,
        lastUpdated: s.lastUpdated,
        batteryLevel: s.batteryLevel,
        value: s.value,
      }));
    });

    return successResponse(res, 'Sensors fetched', sensorStatus);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch sensors', error);
  }
};

const getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ pointsRequired: 1 });
    return successResponse(res, 'Rewards fetched', rewards);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch rewards', error);
  }
};

const createReward = async (req, res) => {
  try {
    const reward = await rewardService.createReward(req.body);
    return successResponse(res, 'Reward created', reward, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create reward', error);
  }
};

const updateReward = async (req, res) => {
  try {
    const reward = await rewardService.updateReward(req.params.id, req.body);
    if (!reward) return errorResponse(res, 'Reward not found', null, 404);
    return successResponse(res, 'Reward updated', reward);
  } catch (error) {
    return errorResponse(res, 'Failed to update reward', error);
  }
};

const deleteReward = async (req, res) => {
  try {
    await rewardService.deleteReward(req.params.id);
    return successResponse(res, 'Reward deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete reward', error);
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    const [
      tripsOverTime,
      violationsOverTime,
      scoreDistribution,
      pointsDistribution,
    ] = await Promise.all([
      DrivingSession.aggregate([
        { $match: { status: 'COMPLETED', ...(Object.keys(dateFilter).length && { startTime: dateFilter }) } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Violation.aggregate([
        { $match: { ...(Object.keys(dateFilter).length && { createdAt: dateFilter }) } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: 'USER' } },
        {
          $bucket: {
            groupBy: '$safetyScore',
            boundaries: [0, 20, 40, 60, 70, 80, 90, 100],
            default: '100+',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      User.aggregate([
        { $match: { role: 'USER' } },
        {
          $bucket: {
            groupBy: '$totalPoints',
            boundaries: [0, 500, 1000, 2000, 3000, 5000, 10000],
            default: '10000+',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    return successResponse(res, 'Analytics fetched', {
      tripsOverTime,
      violationsOverTime,
      scoreDistribution,
      pointsDistribution,
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch analytics', error);
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  getViolations,
  getSensors,
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  getAnalytics,
};
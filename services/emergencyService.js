const Emergency = require('../models/Emergency');
const User = require('../models/User');
const DrivingSession = require('../models/DrivingSession');
const Alert = require('../models/Alert');
const { emitToUser, emitToSession, broadcast } = require('../config/socket');
const { EMERGENCY_TRIGGER_TYPES, EMERGENCY_STATUS, ALERT_TYPES, ALERT_SEVERITY } = require('../utils/constants');

class EmergencyService {
  async triggerSOS(userId, data) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });

    const emergency = await Emergency.create({
      userId,
      drivingSessionId: session?._id,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      contact: data.contact || {
        name: user.name,
        phone: user.mobile,
        relation: 'Self',
      },
      triggerType: data.triggerType || EMERGENCY_TRIGGER_TYPES.MANUAL_SOS,
      status: EMERGENCY_STATUS.TRIGGERED,
      metadata: data.metadata,
    });

    const alert = await Alert.create({
      userId,
      drivingSessionId: session?._id,
      type: ALERT_TYPES.EMERGENCY,
      severity: ALERT_SEVERITY.CRITICAL,
      message: `EMERGENCY SOS TRIGGERED: ${data.triggerType || 'Manual SOS'}`,
      metadata: { emergencyId: emergency._id, location: { lat: data.latitude, lng: data.longitude } },
    });

    emitToUser(userId, 'emergency:trigger', emergency);
    emitToUser(userId, 'alert:new', alert);

    if (session) {
      emitToSession(session._id.toString(), 'emergency:trigger', emergency);
      emitToSession(session._id.toString(), 'alert:new', alert);
    }

    broadcast('admin:emergency', {
      emergency,
      user: { id: user._id, name: user.name, mobile: user.mobile },
    });

    return {
      emergency,
      message: 'Emergency alert prepared and location shared with emergency contacts.',
    };
  }

  async getEmergencyHistory(userId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = { userId };

    if (status) filter.status = status;

    const emergencies = await Emergency.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('drivingSessionId', 'startTime endTime');

    const total = await Emergency.countDocuments(filter);

    return {
      emergencies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getEmergencyById(userId, emergencyId) {
    return Emergency.findOne({ _id: emergencyId, userId }).populate('drivingSessionId');
  }

  async updateEmergencyStatus(emergencyId, status, notes = '') {
    const emergency = await Emergency.findByIdAndUpdate(
      emergencyId,
      { status, notes, resolvedAt: status === EMERGENCY_STATUS.RESOLVED ? new Date() : undefined },
      { new: true }
    );
    return emergency;
  }

  async getAllEmergencies(query = {}) {
    const { page = 1, limit = 50, status, triggerType, startDate, endDate } = query;
    const filter = {};

    if (status) filter.status = status;
    if (triggerType) filter.triggerType = triggerType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const emergencies = await Emergency.find(filter)
      .populate('userId', 'name email mobile')
      .populate('drivingSessionId', 'startTime')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Emergency.countDocuments(filter);

    return {
      emergencies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new EmergencyService();
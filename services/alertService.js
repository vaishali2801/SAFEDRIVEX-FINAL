const Alert = require('../models/Alert');
const { emitToUser, emitToSession } = require('../config/socket');
const { ALERT_TYPES, ALERT_SEVERITY } = require('../utils/constants');

class AlertService {
  async createAlert(data) {
    const alert = await Alert.create(data);

    emitToUser(data.userId, 'alert:new', alert);

    if (data.drivingSessionId) {
      emitToSession(data.drivingSessionId, 'alert:new', alert);
    }

    return alert;
  }

  async getUserAlerts(userId, query = {}) {
    const { isRead, severity, type, page = 1, limit = 20 } = query;
    const filter = { userId };

    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(filter);
    const unreadCount = await Alert.countDocuments({ userId, isRead: false });

    return {
      alerts,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId, alertId) {
    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return alert;
  }

  async markAllAsRead(userId) {
    return Alert.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async getUnreadCount(userId) {
    return Alert.countDocuments({ userId, isRead: false });
  }

  async deleteAlert(userId, alertId) {
    return Alert.findOneAndDelete({ _id: alertId, userId });
  }

  createSpeedWarning(userId, drivingSessionId, speed, speedLimit) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.SPEED_WARNING,
      severity: ALERT_SEVERITY.WARNING,
      message: `Speed warning: ${speed} km/h (limit: ${speedLimit} km/h)`,
      metadata: { speed, speedLimit },
    });
  }

  createOverspeedAlert(userId, drivingSessionId, speed, speedLimit) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.OVERSPEED,
      severity: ALERT_SEVERITY.CRITICAL,
      message: `Over speeding: ${speed} km/h (limit: ${speedLimit} km/h)`,
      metadata: { speed, speedLimit },
    });
  }

  createPhoneAlert(userId, drivingSessionId, confidence) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.PHONE_DETECTED,
      severity: ALERT_SEVERITY.CRITICAL,
      message: `Phone usage detected (${Math.round(confidence * 100)}% confidence)`,
      metadata: { confidence },
    });
  }

  createHelmetAlert(userId, drivingSessionId, isWearing) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: isWearing ? ALERT_TYPES.HELMET_REMINDER : ALERT_TYPES.NO_HELMET,
      severity: isWearing ? ALERT_SEVERITY.INFO : ALERT_SEVERITY.WARNING,
      message: isWearing ? 'Helmet verified' : 'Helmet not detected - Please wear your helmet',
      metadata: { isWearing },
    });
  }

  createSeatbeltAlert(userId, drivingSessionId, isWearing) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: isWearing ? ALERT_TYPES.SEATBELT_REMINDER : ALERT_TYPES.NO_SEATBELT,
      severity: isWearing ? ALERT_SEVERITY.INFO : ALERT_SEVERITY.WARNING,
      message: isWearing ? 'Seat belt fastened' : 'Seat belt not fastened - Please buckle up',
      metadata: { isWearing },
    });
  }

  createDrowsinessAlert(userId, drivingSessionId, confidence) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.DROWSINESS,
      severity: ALERT_SEVERITY.CRITICAL,
      message: `Drowsiness detected (${Math.round(confidence * 100)}% confidence) - Take a break!`,
      metadata: { confidence },
    });
  }

  createEmergencyAlert(userId, drivingSessionId, triggerType, location) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.EMERGENCY,
      severity: ALERT_SEVERITY.CRITICAL,
      message: `Emergency triggered: ${triggerType}`,
      metadata: { triggerType, location },
    });
  }

  createPointsEarnedAlert(userId, drivingSessionId, points, reason) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.POINTS_EARNED,
      severity: ALERT_SEVERITY.INFO,
      message: `+${points} points earned: ${reason}`,
      metadata: { points, reason },
    });
  }

  createAchievementAlert(userId, drivingSessionId, achievement) {
    return this.createAlert({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.ACHIEVEMENT_UNLOCKED,
      severity: ALERT_SEVERITY.INFO,
      message: `Achievement unlocked: ${achievement.name}`,
      metadata: { achievement },
    });
  }
}

module.exports = new AlertService();
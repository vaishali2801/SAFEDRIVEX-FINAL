const User = require('../models/User');
const DrivingSession = require('../models/DrivingSession');
const scoringService = require('./scoringService');
const alertService = require('./alertService');
const { emitToUser, emitToSession } = require('../config/socket');
const {
  VIOLATION_TYPES,
  DRIVING_EVENT_TYPES,
  ALERT_TYPES,
  ALERT_SEVERITY,
} = require('../utils/constants');

class AIService {
  async processHelmetDetection(userId, detected, confidence, metadata = {}) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return { success: false, message: 'No active session' };

    if (!detected) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.NO_HELMET, {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      await alertService.createHelmetAlert(userId, session._id, false);
      return { success: true, detected: false, action: 'violation_created', ...result };
    } else {
      const result = await scoringService.processSafeBehavior(userId, session._id, 'HELMET_COMPLIANCE', {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      await alertService.createHelmetAlert(userId, session._id, true);
      return { success: true, detected: true, action: 'safe_behavior_recorded', ...result };
    }
  }

  async processPhoneDetection(userId, detected, confidence, metadata = {}) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return { success: false, message: 'No active session' };

    if (detected) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.PHONE_USAGE, {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      await alertService.createPhoneAlert(userId, session._id, confidence);
      return { success: true, detected: true, action: 'violation_created', ...result };
    } else {
      const result = await scoringService.processSafeBehavior(userId, session._id, 'NO_PHONE_USAGE', {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      return { success: true, detected: false, action: 'safe_behavior_recorded', ...result };
    }
  }

  async processSeatbeltDetection(userId, detected, confidence, metadata = {}) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return { success: false, message: 'No active session' };

    if (!detected) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.NO_SEATBELT, {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      await alertService.createSeatbeltAlert(userId, session._id, false);
      return { success: true, detected: false, action: 'violation_created', ...result };
    } else {
      const result = await scoringService.processSafeBehavior(userId, session._id, 'SEATBELT_COMPLIANCE', {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      await alertService.createSeatbeltAlert(userId, session._id, true);
      return { success: true, detected: true, action: 'safe_behavior_recorded', ...result };
    }
  }

  async processDrowsinessDetection(userId, detected, confidence, metadata = {}) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return { success: false, message: 'No active session' };

    if (detected) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.DROWSINESS, {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      await alertService.createDrowsinessAlert(userId, session._id, confidence);
      return { success: true, detected: true, action: 'violation_created', ...result };
    }
    return { success: true, detected: false, action: 'no_action' };
  }

  async processLaneDetection(userId, detected, confidence, metadata = {}) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return { success: false, message: 'No active session' };

    if (detected) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.LANE_DEPARTURE, {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      return { success: true, detected: true, action: 'violation_created', ...result };
    } else {
      const result = await scoringService.processSafeBehavior(userId, session._id, 'TRAFFIC_SIGNAL_COMPLIANCE', {
        location: metadata.location,
        confidence,
        ...metadata,
      });
      return { success: true, detected: false, action: 'safe_behavior_recorded', ...result };
    }
  }

  async processDrivingBehaviour(userId, behaviourData, metadata = {}) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return { success: false, message: 'No active session' };

    const results = [];

    if (behaviourData.overspeed) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.OVERSPEED, {
        speed: behaviourData.speed,
        speedLimit: behaviourData.speedLimit,
        location: metadata.location,
        ...metadata,
      });
      await alertService.createOverspeedAlert(userId, session._id, behaviourData.speed, behaviourData.speedLimit);
      results.push({ type: 'OVERSPEED', ...result });
    }

    if (behaviourData.harshBraking) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.HARSH_BRAKING, {
        location: metadata.location,
        ...metadata,
      });
      results.push({ type: 'HARSH_BRAKING', ...result });
    }

    if (behaviourData.rashDriving) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.RASH_DRIVING, {
        location: metadata.location,
        ...metadata,
      });
      results.push({ type: 'RASH_DRIVING', ...result });
    }

    if (behaviourData.wrongSide) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.WRONG_SIDE, {
        location: metadata.location,
        ...metadata,
      });
      results.push({ type: 'WRONG_SIDE', ...result });
    }

    if (behaviourData.signalJump) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.SIGNAL_JUMP, {
        location: metadata.location,
        ...metadata,
      });
      results.push({ type: 'SIGNAL_JUMP', ...result });
    }

    if (behaviourData.alcoholDetected) {
      const result = await scoringService.processViolation(userId, session._id, VIOLATION_TYPES.DRINK_DRIVING, {
        location: metadata.location,
        confidence: behaviourData.confidence,
        ...metadata,
      });
      results.push({ type: 'ALCOHOL_DETECTED', ...result });
    }

    if (behaviourData.safeDriving) {
      const result = await scoringService.processSafeBehavior(userId, session._id, 'SMOOTH_DRIVING', {
        location: metadata.location,
        ...metadata,
      });
      results.push({ type: 'SAFE_DRIVING', ...result });
    }

    return { success: true, results };
  }

  getAIEndpoints() {
    return {
      helmet: '/api/ai/helmet',
      phone: '/api/ai/phone',
      seatbelt: '/api/ai/seatbelt',
      drowsiness: '/api/ai/drowsiness',
      lane: '/api/ai/lane',
      drivingBehaviour: '/api/ai/driving-behaviour',
    };
  }
}

module.exports = new AIService();
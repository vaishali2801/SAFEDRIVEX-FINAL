const User = require('../models/User');
const SafetyScore = require('../models/SafetyScore');
const DrivingEvent = require('../models/DrivingEvent');
const Violation = require('../models/Violation');
const Alert = require('../models/Alert');
const DrivingSession = require('../models/DrivingSession');
const { calculateSafetyScore, calculatePoints } = require('../utils/calculations');
const {
  VIOLATION_PENALTIES,
  SAFE_BEHAVIOR_REWARDS,
  VIOLATION_TYPES,
  DRIVING_EVENT_TYPES,
  ALERT_TYPES,
  ALERT_SEVERITY,
  MIN_SAFETY_SCORE,
  MAX_SAFETY_SCORE,
} = require('../utils/constants');
const { emitToUser, emitToSession } = require('../config/socket');

class ScoringService {
  async processViolation(userId, drivingSessionId, violationType, metadata = {}) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const penalty = VIOLATION_PENALTIES[violationType];
    if (!penalty) throw new Error('Invalid violation type');

    const scoreResult = calculateSafetyScore(user.safetyScore, violationType, true);
    const pointsResult = calculatePoints(user.totalPoints, violationType, true);

    const violation = await Violation.create({
      userId,
      drivingSessionId,
      type: violationType,
      severity: penalty.points >= 100 ? 'CRITICAL' : 'WARNING',
      pointsDeducted: penalty.points,
      scoreDeducted: penalty.score,
      location: metadata.location,
      speed: metadata.speed,
      speedLimit: metadata.speedLimit,
      evidence: metadata.evidence,
      metadata,
    });

    const event = await DrivingEvent.create({
      userId,
      drivingSessionId,
      eventType: this.mapViolationToEvent(violationType),
      value: metadata.value,
      pointsChange: -penalty.points,
      scoreChange: -penalty.score,
      location: metadata.location,
      metadata,
    });

    await SafetyScore.create({
      userId,
      drivingSessionId,
      score: scoreResult.newScore,
      previousScore: user.safetyScore,
      change: scoreResult.change,
      reason: violationType,
      metadata,
    });

    user.safetyScore = scoreResult.newScore;
    user.totalPoints = pointsResult.newPoints;
    await user.save();

    if (drivingSessionId) {
      await DrivingSession.findByIdAndUpdate(drivingSessionId, {
        $inc: { pointsDeducted: penalty.points },
        $push: { violations: violation._id },
        safetyScore: scoreResult.newScore,
      });
    }

    const alert = await Alert.create({
      userId,
      drivingSessionId,
      type: this.mapViolationToAlert(violationType),
      severity: penalty.points >= 100 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
      message: this.getViolationMessage(violationType),
      metadata: { violationId: violation._id, ...metadata },
    });

    emitToUser(userId, 'violation:new', violation);
    emitToUser(userId, 'alert:new', alert);
    emitToUser(userId, 'score:update', { safetyScore: scoreResult.newScore, change: scoreResult.change });
    emitToUser(userId, 'points:update', { totalPoints: pointsResult.newPoints, change: pointsResult.change });

    if (drivingSessionId) {
      emitToSession(drivingSessionId, 'violation:new', violation);
      emitToSession(drivingSessionId, 'alert:new', alert);
      emitToSession(drivingSessionId, 'safety:update', { safetyScore: scoreResult.newScore });
    }

    return { violation, event, alert, scoreResult, pointsResult };
  }

  async processSafeBehavior(userId, drivingSessionId, behaviorType, metadata = {}) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const reward = SAFE_BEHAVIOR_REWARDS[behaviorType];
    if (!reward) throw new Error('Invalid behavior type');

    const scoreResult = calculateSafetyScore(user.safetyScore, behaviorType, false);
    const pointsResult = calculatePoints(user.totalPoints, behaviorType, false);

    const event = await DrivingEvent.create({
      userId,
      drivingSessionId,
      eventType: this.mapBehaviorToEvent(behaviorType),
      value: metadata.value,
      pointsChange: reward.points,
      scoreChange: reward.score,
      location: metadata.location,
      metadata,
    });

    await SafetyScore.create({
      userId,
      drivingSessionId,
      score: scoreResult.newScore,
      previousScore: user.safetyScore,
      change: scoreResult.change,
      reason: behaviorType,
      metadata,
    });

    user.safetyScore = scoreResult.newScore;
    user.totalPoints = pointsResult.newPoints;
    await user.save();

    if (drivingSessionId) {
      await DrivingSession.findByIdAndUpdate(drivingSessionId, {
        $inc: { pointsEarned: reward.points },
        safetyScore: scoreResult.newScore,
      });
    }

    const alert = await Alert.create({
      userId,
      drivingSessionId,
      type: ALERT_TYPES.SAFE_DRIVING,
      severity: ALERT_SEVERITY.INFO,
      message: this.getSafeBehaviorMessage(behaviorType),
      metadata: { eventId: event._id, ...metadata },
    });

    emitToUser(userId, 'score:update', { safetyScore: scoreResult.newScore, change: scoreResult.change });
    emitToUser(userId, 'points:update', { totalPoints: pointsResult.newPoints, change: pointsResult.change });

    if (drivingSessionId) {
      emitToSession(drivingSessionId, 'safety:update', { safetyScore: scoreResult.newScore });
    }

    return { event, alert, scoreResult, pointsResult };
  }

  mapViolationToEvent(violationType) {
    const mapping = {
      [VIOLATION_TYPES.NO_HELMET]: DRIVING_EVENT_TYPES.NO_HELMET,
      [VIOLATION_TYPES.NO_SEATBELT]: DRIVING_EVENT_TYPES.NO_SEATBELT,
      [VIOLATION_TYPES.PHONE_USAGE]: DRIVING_EVENT_TYPES.PHONE_DETECTED,
      [VIOLATION_TYPES.OVERSPEED]: DRIVING_EVENT_TYPES.OVERSPEED,
      [VIOLATION_TYPES.WRONG_SIDE]: DRIVING_EVENT_TYPES.WRONG_SIDE,
      [VIOLATION_TYPES.SIGNAL_JUMP]: DRIVING_EVENT_TYPES.SIGNAL_COMPLIANCE,
      [VIOLATION_TYPES.RASH_DRIVING]: DRIVING_EVENT_TYPES.RASH_DRIVING,
      [VIOLATION_TYPES.DRINK_DRIVING]: DRIVING_EVENT_TYPES.ALCOHOL_DETECTED,
      [VIOLATION_TYPES.DROWSINESS]: DRIVING_EVENT_TYPES.DROWSINESS,
      [VIOLATION_TYPES.HARSH_BRAKING]: DRIVING_EVENT_TYPES.HARSH_BRAKING,
      [VIOLATION_TYPES.LANE_DEPARTURE]: DRIVING_EVENT_TYPES.LANE_DEPARTURE,
      [VIOLATION_TYPES.ALCOHOL_DETECTED]: DRIVING_EVENT_TYPES.ALCOHOL_DETECTED,
    };
    return mapping[violationType] || DRIVING_EVENT_TYPES.RASH_DRIVING;
  }

  mapViolationToAlert(violationType) {
    const mapping = {
      [VIOLATION_TYPES.NO_HELMET]: ALERT_TYPES.NO_HELMET,
      [VIOLATION_TYPES.NO_SEATBELT]: ALERT_TYPES.NO_SEATBELT,
      [VIOLATION_TYPES.PHONE_USAGE]: ALERT_TYPES.PHONE_DETECTED,
      [VIOLATION_TYPES.OVERSPEED]: ALERT_TYPES.OVERSPEED,
      [VIOLATION_TYPES.WRONG_SIDE]: ALERT_TYPES.WRONG_SIDE,
      [VIOLATION_TYPES.SIGNAL_JUMP]: ALERT_TYPES.SIGNAL_JUMP,
      [VIOLATION_TYPES.RASH_DRIVING]: ALERT_TYPES.RASH_DRIVING,
      [VIOLATION_TYPES.DRINK_DRIVING]: ALERT_TYPES.ALCOHOL_DETECTED,
      [VIOLATION_TYPES.DROWSINESS]: ALERT_TYPES.DROWSINESS,
      [VIOLATION_TYPES.HARSH_BRAKING]: ALERT_TYPES.HARSH_BRAKING,
      [VIOLATION_TYPES.LANE_DEPARTURE]: ALERT_TYPES.RASH_DRIVING,
      [VIOLATION_TYPES.ALCOHOL_DETECTED]: ALERT_TYPES.ALCOHOL_DETECTED,
    };
    return mapping[violationType] || ALERT_TYPES.RASH_DRIVING;
  }

  mapBehaviorToEvent(behaviorType) {
    const mapping = {
      HELMET_COMPLIANCE: DRIVING_EVENT_TYPES.HELMET_VERIFIED,
      SEATBELT_COMPLIANCE: DRIVING_EVENT_TYPES.SEATBELT_VERIFIED,
      SPEED_COMPLIANCE: DRIVING_EVENT_TYPES.SAFE_SPEED,
      NO_PHONE_USAGE: DRIVING_EVENT_TYPES.SAFE_SPEED,
      SMOOTH_DRIVING: DRIVING_EVENT_TYPES.SAFE_SPEED,
      SAFE_BRAKING: DRIVING_EVENT_TYPES.SAFE_BRAKING,
      TRAFFIC_SIGNAL_COMPLIANCE: DRIVING_EVENT_TYPES.SIGNAL_COMPLIANCE,
      SAFE_DISTANCE: DRIVING_EVENT_TYPES.SAFE_SPEED,
      DAILY_CHALLENGE: DRIVING_EVENT_TYPES.SAFE_SPEED,
      WEEKLY_SAFE_DRIVER: DRIVING_EVENT_TYPES.SAFE_SPEED,
    };
    return mapping[behaviorType] || DRIVING_EVENT_TYPES.SAFE_SPEED;
  }

  getViolationMessage(violationType) {
    const messages = {
      [VIOLATION_TYPES.NO_HELMET]: 'Helmet not detected - Please wear your helmet',
      [VIOLATION_TYPES.NO_SEATBELT]: 'Seat belt not fastened - Please buckle up',
      [VIOLATION_TYPES.PHONE_USAGE]: 'Phone usage detected while driving - Please focus on the road',
      [VIOLATION_TYPES.OVERSPEED]: 'Over speeding detected - Please reduce speed',
      [VIOLATION_TYPES.WRONG_SIDE]: 'Wrong side driving detected - Immediate correction required',
      [VIOLATION_TYPES.SIGNAL_JUMP]: 'Traffic signal violation - Stop at red lights',
      [VIOLATION_TYPES.RASH_DRIVING]: 'Rash driving detected - Drive safely',
      [VIOLATION_TYPES.DRINK_DRIVING]: 'Alcohol detected - Do not drive under influence',
      [VIOLATION_TYPES.DROWSINESS]: 'Drowsiness detected - Take a break',
      [VIOLATION_TYPES.HARSH_BRAKING]: 'Harsh braking detected - Maintain safe distance',
      [VIOLATION_TYPES.LANE_DEPARTURE]: 'Lane departure detected - Stay in your lane',
      [VIOLATION_TYPES.ALCOHOL_DETECTED]: 'Alcohol detected - Do not drive',
    };
    return messages[violationType] || 'Unsafe driving behavior detected';
  }

  getSafeBehaviorMessage(behaviorType) {
    const messages = {
      HELMET_COMPLIANCE: 'Helmet verified - Great job!',
      SEATBELT_COMPLIANCE: 'Seat belt fastened - Safety first!',
      SPEED_COMPLIANCE: 'Maintaining safe speed - Well done!',
      NO_PHONE_USAGE: 'No phone usage - Focused driving!',
      SMOOTH_DRIVING: 'Smooth driving detected - Excellent!',
      SAFE_BRAKING: 'Safe braking - Good control!',
      TRAFFIC_SIGNAL_COMPLIANCE: 'Traffic signal compliance - Responsible driving!',
      SAFE_DISTANCE: 'Safe distance maintained - Keep it up!',
      DAILY_CHALLENGE: 'Daily challenge completed - Amazing!',
      WEEKLY_SAFE_DRIVER: 'Weekly safe driver - Champion!',
    };
    return messages[behaviorType] || 'Safe behavior detected';
  }

  async getUserSafetyScore(userId) {
    const user = await User.findById(userId).select('safetyScore totalPoints');
    return user;
  }

  async getSafetyScoreHistory(userId, limit = 50) {
    return SafetyScore.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('drivingSessionId', 'startTime endTime');
  }
}

module.exports = new ScoringService();
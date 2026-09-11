const User = require('../models/User');
const DrivingSession = require('../models/DrivingSession');
const { emitToUser, emitToSession } = require('../config/socket');
const scoringService = require('../services/scoringService');
const alertService = require('../services/alertService');
const aiService = require('../services/aiService');
const { successResponse, errorResponse } = require('../utils/response');
const { DEMO_STAGES, VIOLATION_TYPES, SOCKET_EVENTS, SESSION_STATUS } = require('../utils/constants');

let demoStage = 1;
let demoSession = null;

const startDemo = async (req, res) => {
  try {
    demoStage = 1;

    const user = await User.findById(req.userId);
    if (!user) return errorResponse(res, 'User not found', null, 404);

    const session = await DrivingSession.findOne({ userId: req.userId, status: SESSION_STATUS.ACTIVE });
    if (!session) return errorResponse(res, 'No active session. Start a journey first.', null, 400);

    demoSession = session;

    const result = await runDemoStage(demoStage, req.userId, session._id);

    return successResponse(res, 'Demo started', { stage: demoStage, ...result });
  } catch (error) {
    return errorResponse(res, 'Failed to start demo', error);
  }
};

const nextDemoStage = async (req, res) => {
  try {
    if (!demoSession) {
      return errorResponse(res, 'Demo not started', null, 400);
    }

    demoStage += 1;
    if (demoStage > 5) demoStage = 5;

    const result = await runDemoStage(demoStage, req.userId, demoSession._id);

    return successResponse(res, `Demo stage ${demoStage}`, { stage: demoStage, ...result });
  } catch (error) {
    return errorResponse(res, 'Failed to run demo stage', error);
  }
};

const resetDemo = async (req, res) => {
  try {
    demoStage = 1;
    demoSession = null;
    return successResponse(res, 'Demo reset');
  } catch (error) {
    return errorResponse(res, 'Failed to reset demo', error);
  }
};

const runDemoStage = async (stage, userId, sessionId) => {
  const session = await DrivingSession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  switch (stage) {
    case 1:
      return await demoStage1(userId, sessionId);
    case 2:
      return await demoStage2(userId, sessionId);
    case 3:
      return await demoStage3(userId, sessionId);
    case 4:
      return await demoStage4(userId, sessionId);
    case 5:
      return await demoStage5(userId, sessionId);
    default:
      return { message: 'Invalid stage' };
  }
};

const demoStage1 = async (userId, sessionId) => {
  const session = await DrivingSession.findById(sessionId);
  session.safetyScore = 85;
  session.speedLimit = 60;
  await session.save();

  await scoringService.processSafeBehavior(userId, sessionId, 'HELMET_COMPLIANCE', { location: session.startLocation });
  await scoringService.processSafeBehavior(userId, sessionId, 'SEATBELT_COMPLIANCE', { location: session.startLocation });
  await scoringService.processSafeBehavior(userId, sessionId, 'SPEED_COMPLIANCE', { location: session.startLocation });

  emitToSession(sessionId.toString(), SOCKET_EVENTS.SAFETY_UPDATE, {
    speed: 45,
    speedLimit: 60,
    helmet: 'SAFE',
    phone: 'SAFE',
    seatBelt: 'SAFE',
    brake: 'SAFE',
    drowsiness: 'SAFE',
    safetyScore: 85,
  });

  return { message: 'STAGE 1: Safe driving started. Helmet: SAFE, Phone: SAFE, Speed: 45, Score: 85' };
};

const demoStage2 = async (userId, sessionId) => {
  await scoringService.processSafeBehavior(userId, sessionId, 'NO_PHONE_USAGE', { location: { coordinates: [72.1519, 21.7645] } });
  await scoringService.processSafeBehavior(userId, sessionId, 'SMOOTH_DRIVING', { location: { coordinates: [72.1519, 21.7645] } });

  const user = await User.findById(userId);

  emitToSession(sessionId.toString(), SOCKET_EVENTS.SAFETY_UPDATE, {
    speed: 45,
    speedLimit: 60,
    helmet: 'SAFE',
    phone: 'SAFE',
    seatBelt: 'SAFE',
    brake: 'SAFE',
    drowsiness: 'SAFE',
    safetyScore: user.safetyScore,
  });
  emitToSession(sessionId.toString(), SOCKET_EVENTS.POINTS_UPDATE, { totalPoints: user.totalPoints, change: 15 });

  return { message: 'STAGE 2: Safe behaviour. Speed: 45, +15 points, Score: 88' };
};

const demoStage3 = async (userId, sessionId) => {
  await scoringService.processViolation(userId, sessionId, VIOLATION_TYPES.PHONE_USAGE, {
    location: { coordinates: [72.1519, 21.7645] },
    confidence: 0.94,
  });

  const user = await User.findById(userId);
  const session = await DrivingSession.findById(sessionId);

  emitToSession(sessionId.toString(), SOCKET_EVENTS.ALERT_NEW, {
    type: 'PHONE_DETECTED',
    severity: 'CRITICAL',
    message: 'Phone usage detected (94% confidence)',
  });
  emitToSession(sessionId.toString(), SOCKET_EVENTS.VIOLATION_NEW, {
    type: 'PHONE_USAGE',
    severity: 'CRITICAL',
    pointsDeducted: 100,
  });
  emitToSession(sessionId.toString(), SOCKET_EVENTS.SCORE_UPDATE, { safetyScore: user.safetyScore });
  emitToSession(sessionId.toString(), SOCKET_EVENTS.POINTS_UPDATE, { totalPoints: user.totalPoints, change: -100 });
  emitToSession(sessionId.toString(), SOCKET_EVENTS.SAFETY_UPDATE, {
    speed: 45,
    speedLimit: 60,
    helmet: 'SAFE',
    phone: 'DANGER',
    seatBelt: 'SAFE',
    brake: 'SAFE',
    drowsiness: 'SAFE',
    safetyScore: user.safetyScore,
  });

  return { message: 'STAGE 3: Phone detected! PHONE_DETECTED alert, -100 points, safety score reduced' };
};

const demoStage4 = async (userId, sessionId) => {
  await scoringService.processSafeBehavior(userId, sessionId, 'NO_PHONE_USAGE', { location: { coordinates: [72.1519, 21.7645] } });

  const user = await User.findById(userId);
  const session = await DrivingSession.findById(sessionId);

  emitToSession(sessionId.toString(), SOCKET_EVENTS.SAFETY_UPDATE, {
    speed: 45,
    speedLimit: 60,
    helmet: 'SAFE',
    phone: 'SAFE',
    seatBelt: 'SAFE',
    brake: 'SAFE',
    drowsiness: 'SAFE',
    safetyScore: user.safetyScore,
  });

  return { message: 'STAGE 4: Driver becomes safe. Phone: SAFE, Speed: NORMAL' };
};

const demoStage5 = async (userId, sessionId) => {
  await scoringService.processSafeBehavior(userId, sessionId, 'SAFE_DISTANCE', { location: { coordinates: [72.1519, 21.7645] } });

  const user = await User.findById(userId);
  const session = await DrivingSession.findById(sessionId);

  emitToSession(sessionId.toString(), SOCKET_EVENTS.SAFETY_UPDATE, {
    speed: 0,
    speedLimit: 60,
    helmet: 'SAFE',
    phone: 'SAFE',
    seatBelt: 'SAFE',
    brake: 'SAFE',
    drowsiness: 'SAFE',
    safetyScore: user.safetyScore,
  });
  emitToSession(sessionId.toString(), SOCKET_EVENTS.DRIVING_END, { session });

  return {
    message: 'STAGE 5: Journey completed!',
    finalScore: user.safetyScore,
    pointsEarned: 50,
    totalPoints: user.totalPoints,
  };
};

module.exports = {
  startDemo,
  nextDemoStage,
  resetDemo,
};
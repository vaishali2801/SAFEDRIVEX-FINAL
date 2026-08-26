const User = require('../models/User');
const DrivingSession = require('../models/DrivingSession');
const { emitToUser, emitToSession } = require('../config/socket');
const scoringService = require('../services/scoringService');
const alertService = require('../services/alertService');
const aiService = require('../services/aiService');
const { successResponse, errorResponse } = require('../utils/response');
const { SIMULATION_MODES, VIOLATION_TYPES, SOCKET_EVENTS, SESSION_STATUS } = require('../utils/constants');

let simulationInterval = null;
let currentMode = SIMULATION_MODES.SAFE;
let demoStage = 1;

const startDemo = async (req, res) => {
  try {
    // Demo logic
    return res.status(200).json({
      success: true,
      message: 'Demo started',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const nextDemoStage = async (req, res) => {
  try {
    // Demo next stage logic
    return res.status(200).json({
      success: true,
      message: 'Demo moved to next stage',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const resetDemo = async (req, res) => {
  try {
    // Demo reset logic
    return res.status(200).json({
      success: true,
      message: 'Demo reset',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const startSimulation = async (req, res) => {
  try {
    const { mode = SIMULATION_MODES.SAFE } = req.body;
    currentMode = mode;

    const session = await DrivingSession.findOne({ userId: req.userId, status: SESSION_STATUS.ACTIVE });
    if (!session) return errorResponse(res, 'No active session', null, 400);

    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(async () => {
      await simulateSensorData(req.userId, session._id);
    }, 3000);

    return successResponse(res, 'Simulation started', { mode });
  } catch (error) {
    return errorResponse(res, 'Failed to start simulation', error);
  }
};

const stopSimulation = async (req, res) => {
  try {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    return successResponse(res, 'Simulation stopped');
  } catch (error) {
    return errorResponse(res, 'Failed to stop simulation', error);
  }
};

const simulateSafe = async (req, res) => {
  try {
    const session = await DrivingSession.findOne({ userId: req.userId, status: SESSION_STATUS.ACTIVE });
    if (!session) return errorResponse(res, 'No active session', null, 400);

    await simulateSafeDriving(req.userId, session._id);
    return successResponse(res, 'Safe driving simulated');
  } catch (error) {
    return errorResponse(res, 'Failed to simulate safe driving', error);
  }
};

const simulateWarning = async (req, res) => {
  try {
    const session = await DrivingSession.findOne({ userId: req.userId, status: SESSION_STATUS.ACTIVE });
    if (!session) return errorResponse(res, 'No active session', null, 400);

    await simulateWarningDriving(req.userId, session._id);
    return successResponse(res, 'Warning driving simulated');
  } catch (error) {
    return errorResponse(res, 'Failed to simulate warning', error);
  }
};

const simulateViolation = async (req, res) => {
  try {
    const { type = VIOLATION_TYPES.PHONE_USAGE } = req.body;
    const session = await DrivingSession.findOne({ userId: req.userId, status: SESSION_STATUS.ACTIVE });
    if (!session) return errorResponse(res, 'No active session', null, 400);

    await simulateViolationDriving(req.userId, session._id, type);
    return successResponse(res, 'Violation simulated');
  } catch (error) {
    return errorResponse(res, 'Failed to simulate violation', error);
  }
};

const simulateEmergency = async (req, res) => {
  try {
    const session = await DrivingSession.findOne({ userId: req.userId, status: SESSION_STATUS.ACTIVE });
    if (!session) return errorResponse(res, 'No active session', null, 400);

    await aiService.processDrivingBehaviour(req.userId, { harshImpact: true }, { location: session.startLocation });
    return successResponse(res, 'Emergency simulated');
  } catch (error) {
    return errorResponse(res, 'Failed to simulate emergency', error);
  }
};

const simulateSensorData = async (userId, sessionId) => {
  const session = await DrivingSession.findById(sessionId);
  if (!session || session.status !== SESSION_STATUS.ACTIVE) {
    if (simulationInterval) clearInterval(simulationInterval);
    return;
  }

  const speed = 40 + Math.random() * 20;
  const location = session.startLocation.coordinates;

  await aiService.processDrivingBehaviour(userId, {
    speed,
    speedLimit: session.speedLimit,
    safeDriving: currentMode === SIMULATION_MODES.SAFE,
    overspeed: currentMode !== SIMULATION_MODES.SAFE && speed > session.speedLimit,
    harshBraking: currentMode === SIMULATION_MODES.VIOLATION && Math.random() > 0.8,
  }, { location });

  emitToSession(sessionId.toString(), SOCKET_EVENTS.SPEED_UPDATE, { speed, speedLimit: session.speedLimit });
  emitToSession(sessionId.toString(), SOCKET_EVENTS.SAFETY_UPDATE, {
    speed,
    speedLimit: session.speedLimit,
    helmet: 'SAFE',
    phone: 'SAFE',
    safetyScore: session.safetyScore,
  });
};

const simulateSafeDriving = async (userId, sessionId) => {
  await scoringService.processSafeBehavior(userId, sessionId, 'SPEED_COMPLIANCE', {
    location: { coordinates: [72.1519, 21.7645] },
  });
  await scoringService.processSafeBehavior(userId, sessionId, 'NO_PHONE_USAGE', {
    location: { coordinates: [72.1519, 21.7645] },
  });
};

const simulateWarningDriving = async (userId, sessionId) => {
  await alertService.createSpeedWarning(userId, sessionId, 75, 60);
};

const simulateViolationDriving = async (userId, sessionId, type) => {
  await scoringService.processViolation(userId, sessionId, type, {
    location: { coordinates: [72.1519, 21.7645] },
  });
};

module.exports = {
  startSimulation,
  stopSimulation,
  simulateSafe,
  simulateWarning,
  simulateViolation,
  simulateEmergency,

  startDemo,
  nextDemoStage,
  resetDemo,
};
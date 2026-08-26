const drivingService = require('../services/drivingService');
const { successResponse, errorResponse } = require('../utils/response');

const startSession = async (req, res) => {
  try {
    const session = await drivingService.startSession(req.userId, req.body);
    return successResponse(res, 'Driving session started', session, 201);
  } catch (error) {
    return errorResponse(res, error.message, error, 400);
  }
};

const getActiveSession = async (req, res) => {
  try {
    const session = await drivingService.getActiveSession(req.userId);
    if (!session) {
      return successResponse(res, 'No active session', null);
    }
    return successResponse(res, 'Active session fetched', session);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch active session', error);
  }
};

const endSession = async (req, res) => {
  try {
    const session = await drivingService.endSession(req.userId, req.body);
    return successResponse(res, 'Driving session ended', session);
  } catch (error) {
    return errorResponse(res, error.message, error, 400);
  }
};

const getHistory = async (req, res) => {
  try {
    const result = await drivingService.getHistory(req.userId, req.query);
    return successResponse(res, 'Driving history fetched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch history', error);
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await drivingService.getSessionById(req.userId, req.params.id);
    if (!session) {
      return errorResponse(res, 'Session not found', null, 404);
    }
    return successResponse(res, 'Session fetched', session);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch session', error);
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await drivingService.getStats(req.userId);
    return successResponse(res, 'Driving stats fetched', stats);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch stats', error);
  }
};

const updateSession = async (req, res) => {
  try {
    const session = await drivingService.updateSessionData(req.params.id, req.body);
    if (!session) {
      return errorResponse(res, 'No active session found', null, 404);
    }
    return successResponse(res, 'Session updated', session);
  } catch (error) {
    return errorResponse(res, 'Failed to update session', error);
  }
};

const getSensorStatus = async (req, res) => {
  try {
    const sensors = await drivingService.getSensorStatus(req.userId);
    return successResponse(res, 'Sensor status fetched', sensors);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch sensor status', error);
  }
};

module.exports = {
  startSession,
  getActiveSession,
  endSession,
  getHistory,
  getSessionById,
  getStats,
  updateSession,
  getSensorStatus,
};
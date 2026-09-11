const emergencyService = require('../services/emergencyService');
const { successResponse, errorResponse } = require('../utils/response');
const { EMERGENCY_TRIGGER_TYPES } = require('../utils/constants');

const triggerSOS = async (req, res) => {
  try {
    const result = await emergencyService.triggerSOS(req.userId, req.body);
    return successResponse(res, 'Emergency SOS triggered', result);
  } catch (error) {
    return errorResponse(res, 'Failed to trigger SOS', error);
  }
};

const getEmergencyHistory = async (req, res) => {
  try {
    const result = await emergencyService.getEmergencyHistory(req.userId, req.query);
    return successResponse(res, 'Emergency history fetched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch emergency history', error);
  }
};

const getEmergencyById = async (req, res) => {
  try {
    const emergency = await emergencyService.getEmergencyById(req.userId, req.params.id);
    if (!emergency) return errorResponse(res, 'Emergency not found', null, 404);
    return successResponse(res, 'Emergency fetched', emergency);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch emergency', error);
  }
};

module.exports = {
  triggerSOS,
  getEmergencyHistory,
  getEmergencyById,
};
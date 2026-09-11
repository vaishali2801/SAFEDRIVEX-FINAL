const aiService = require('../services/aiService');
const { successResponse, errorResponse } = require('../utils/response');

const helmetDetection = async (req, res) => {
  try {
    const { detected, confidence, ...metadata } = req.body;
    const result = await aiService.processHelmetDetection(req.body.userId, detected, confidence, metadata);
    return successResponse(res, 'Helmet detection processed', result);
  } catch (error) {
    return errorResponse(res, 'Failed to process helmet detection', error);
  }
};

const phoneDetection = async (req, res) => {
  try {
    const { detected, confidence, ...metadata } = req.body;
    const result = await aiService.processPhoneDetection(req.body.userId, detected, confidence, metadata);
    return successResponse(res, 'Phone detection processed', result);
  } catch (error) {
    return errorResponse(res, 'Failed to process phone detection', error);
  }
};

const seatbeltDetection = async (req, res) => {
  try {
    const { detected, confidence, ...metadata } = req.body;
    const result = await aiService.processSeatbeltDetection(req.body.userId, detected, confidence, metadata);
    return successResponse(res, 'Seatbelt detection processed', result);
  } catch (error) {
    return errorResponse(res, 'Failed to process seatbelt detection', error);
  }
};

const drowsinessDetection = async (req, res) => {
  try {
    const { detected, confidence, ...metadata } = req.body;
    const result = await aiService.processDrowsinessDetection(req.body.userId, detected, confidence, metadata);
    return successResponse(res, 'Drowsiness detection processed', result);
  } catch (error) {
    return errorResponse(res, 'Failed to process drowsiness detection', error);
  }
};

const laneDetection = async (req, res) => {
  try {
    const { detected, confidence, ...metadata } = req.body;
    const result = await aiService.processLaneDetection(req.body.userId, detected, confidence, metadata);
    return successResponse(res, 'Lane detection processed', result);
  } catch (error) {
    return errorResponse(res, 'Failed to process lane detection', error);
  }
};

const drivingBehaviour = async (req, res) => {
  try {
    const result = await aiService.processDrivingBehaviour(req.body.userId, req.body, req.body.metadata);
    return successResponse(res, 'Driving behaviour processed', result);
  } catch (error) {
    return errorResponse(res, 'Failed to process driving behaviour', error);
  }
};

const getAIEndpoints = async (req, res) => {
  try {
    const endpoints = aiService.getAIEndpoints();
    return successResponse(res, 'AI endpoints', endpoints);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch endpoints', error);
  }
};

module.exports = {
  helmetDetection,
  phoneDetection,
  seatbeltDetection,
  drowsinessDetection,
  laneDetection,
  drivingBehaviour,
  getAIEndpoints,
};
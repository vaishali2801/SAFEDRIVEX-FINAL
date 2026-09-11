const sensorService = require('../services/sensorService');
const { successResponse, errorResponse } = require('../utils/response');

const receiveSensorData = async (req, res) => {
  try {
    const result = await sensorService.receiveSensorData(req.body);
    return successResponse(res, 'Sensor data received', result);
  } catch (error) {
    return errorResponse(res, 'Failed to process sensor data', error);
  }
};

const getSensors = async (req, res) => {
  try {
    const result = await sensorService.getAllSensors(req.query);
    return successResponse(res, 'Sensors fetched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch sensors', error);
  }
};

const getSensorByDeviceId = async (req, res) => {
  try {
    const sensors = await sensorService.getSensorByDeviceId(req.params.deviceId);
    return successResponse(res, 'Device sensors fetched', sensors);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch device sensors', error);
  }
};

const updateSensorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const sensor = await sensorService.updateSensorStatus(req.params.deviceId, req.params.sensorType, status);
    if (!sensor) return errorResponse(res, 'Sensor not found', null, 404);
    return successResponse(res, 'Sensor status updated', sensor);
  } catch (error) {
    return errorResponse(res, 'Failed to update sensor status', error);
  }
};

const getDeviceStatus = async (req, res) => {
  try {
    const result = await sensorService.getDeviceStatus(req.params.deviceId);
    if (!result) return errorResponse(res, 'Device not found', null, 404);
    return successResponse(res, 'Device status fetched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch device status', error);
  }
};

const registerDevice = async (req, res) => {
  try {
    const device = await sensorService.registerDevice({ ...req.body, userId: req.userId });
    return successResponse(res, 'Device registered', device, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to register device', error);
  }
};

const getUserDevices = async (req, res) => {
  try {
    const devices = await sensorService.getUserDevices(req.userId);
    return successResponse(res, 'User devices fetched', devices);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch devices', error);
  }
};

module.exports = {
  receiveSensorData,
  getSensors,
  getSensorByDeviceId,
  updateSensorStatus,
  getDeviceStatus,
  registerDevice,
  getUserDevices,
};
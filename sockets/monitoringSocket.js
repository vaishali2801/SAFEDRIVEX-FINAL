const { getIO } = require('../config/socket');
const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const { SENSOR_STATUS, DEVICE_TYPES } = require('../utils/constants');

const startMonitoring = () => {
  setInterval(async () => {
    await checkOfflineDevices();
  }, 30000);
};

const checkOfflineDevices = async () => {
  const io = getIO();
  const threshold = new Date(Date.now() - 5 * 60 * 1000);

  const devices = await Device.find({
    status: SENSOR_STATUS.ONLINE,
    lastSeen: { $lt: threshold },
  });

  for (const device of devices) {
    device.status = SENSOR_STATUS.OFFLINE;
    await device.save();

    await Sensor.updateMany(
      { deviceId: device.deviceId },
      { status: SENSOR_STATUS.OFFLINE }
    );

    if (device.userId) {
      io.to(`user:${device.userId}`).emit('sensor:update', {
        deviceId: device.deviceId,
        status: SENSOR_STATUS.OFFLINE,
        message: 'Device went offline',
        timestamp: new Date(),
      });
    }
  }
};

const broadcastSafetyUpdate = (userId, data) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('safety:update', data);
};

const broadcastSpeedUpdate = (userId, data) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('speed:update', data);
};

const broadcastAlert = (userId, alert) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('alert:new', alert);
};

const broadcastViolation = (userId, violation) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('violation:new', violation);
};

const broadcastScoreUpdate = (userId, data) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('score:update', data);
};

const broadcastPointsUpdate = (userId, data) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('points:update', data);
};

const broadcastDrivingStart = (userId, session) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('driving:start', session);
};

const broadcastDrivingEnd = (userId, session) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('driving:end', session);
};

const broadcastEmergency = (userId, emergency) => {
  const io = getIO();
  io.to(`user:${userId}`).emit('emergency:trigger', emergency);
};

const broadcastToAdmins = (event, data) => {
  const io = getIO();
  io.to('admin:room').emit(event, data);
};

module.exports = {
  startMonitoring,
  broadcastSafetyUpdate,
  broadcastSpeedUpdate,
  broadcastAlert,
  broadcastViolation,
  broadcastScoreUpdate,
  broadcastPointsUpdate,
  broadcastDrivingStart,
  broadcastDrivingEnd,
  broadcastEmergency,
  broadcastToAdmins,
};
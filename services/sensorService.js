const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const DrivingSession = require('../models/DrivingSession');
const { emitToUser, emitToSession } = require('../config/socket');
const { SENSOR_TYPES, SENSOR_STATUS, DEVICE_TYPES } = require('../utils/constants');
const drivingService = require('./drivingService');

class SensorService {
  async receiveSensorData(data) {
    const { deviceId, sensorType, value, unit, batteryLevel, metadata } = data;

    let device = await Device.findOne({ deviceId });
    if (!device) {
      device = await Device.create({
        deviceId,
        type: DEVICE_TYPES.ESP32,
        status: SENSOR_STATUS.ONLINE,
        lastSeen: new Date(),
      });
    } else {
      device.status = SENSOR_STATUS.ONLINE;
      device.lastSeen = new Date();
      await device.save();
    }

    let sensor = await Sensor.findOne({ deviceId, type: sensorType });
    if (!sensor) {
      sensor = await Sensor.create({
        deviceId,
        userId: device.userId,
        type: sensorType,
        status: SENSOR_STATUS.ONLINE,
        value,
        unit,
        batteryLevel,
        metadata,
        lastUpdated: new Date(),
      });
    } else {
      sensor.value = value;
      sensor.unit = unit;
      sensor.batteryLevel = batteryLevel;
      sensor.metadata = metadata;
      sensor.status = SENSOR_STATUS.ONLINE;
      sensor.lastUpdated = new Date();
      await sensor.save();
    }

    if (sensorType === SENSOR_TYPES.GPS && value) {
      await this.processGPSData(device.userId, value);
    }

    if (sensorType === SENSOR_TYPES.ACCELEROMETER && value) {
      await this.processAccelerometerData(device.userId, value);
    }

    emitToUser(device.userId?.toString(), 'sensor:update', {
      deviceId,
      sensorType,
      value,
      status: SENSOR_STATUS.ONLINE,
      timestamp: new Date(),
    });

    return { sensor, device };
  }

  async processGPSData(userId, gpsData) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return;

    const speed = gpsData.speed || 0;
    const location = {
      coordinates: [gpsData.longitude, gpsData.latitude],
    };

    await drivingService.updateSessionData(session._id, {
      speed,
      location,
      speedLimit: session.speedLimit,
    });
  }

  async processAccelerometerData(userId, accelData) {
    const session = await DrivingSession.findOne({ userId, status: 'ACTIVE' });
    if (!session) return;

    const { x, y, z } = accelData;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    if (magnitude > 15) {
      await drivingService.updateSessionData(session._id, {
        harshBraking: true,
        location: { coordinates: session.startLocation.coordinates },
      });
    }

    if (magnitude > 20) {
      await drivingService.updateSessionData(session._id, {
        rashDriving: true,
        location: { coordinates: session.startLocation.coordinates },
      });
    }
  }

  async getAllSensors(query = {}) {
    const { userId, deviceId, type, status, page = 1, limit = 50 } = query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (deviceId) filter.deviceId = deviceId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const sensors = await Sensor.find(filter)
      .populate('userId', 'name email')
      .sort({ lastUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Sensor.countDocuments(filter);

    return {
      sensors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSensorByDeviceId(deviceId) {
    return Sensor.find({ deviceId }).populate('userId', 'name email');
  }

  async updateSensorStatus(deviceId, sensorType, status) {
    return Sensor.findOneAndUpdate(
      { deviceId, type: sensorType },
      { status, lastUpdated: new Date() },
      { new: true }
    );
  }

  async getDeviceStatus(deviceId) {
    const device = await Device.findOne({ deviceId }).populate('userId', 'name email');
    if (!device) return null;

    const sensors = await Sensor.find({ deviceId });
    return { device, sensors };
  }

  async registerDevice(deviceData) {
    const { deviceId, userId, vehicleId, name, type, firmwareVersion } = deviceData;

    let device = await Device.findOne({ deviceId });
    if (device) {
      device.userId = userId;
      device.vehicleId = vehicleId;
      device.name = name;
      device.type = type;
      device.firmwareVersion = firmwareVersion;
      device.status = SENSOR_STATUS.ONLINE;
      device.lastSeen = new Date();
      await device.save();
    } else {
      device = await Device.create({
        deviceId,
        userId,
        vehicleId,
        name,
        type,
        firmwareVersion,
        status: SENSOR_STATUS.ONLINE,
        lastSeen: new Date(),
      });
    }

    return device;
  }

  async getUserDevices(userId) {
    return Device.find({ userId, isActive: true })
      .populate('vehicleId', 'vehicleNumber vehicleType')
      .populate('sensors');
  }

  async checkOfflineDevices(thresholdMinutes = 5) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
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
        emitToUser(device.userId.toString(), 'sensor:update', {
          deviceId: device.deviceId,
          status: SENSOR_STATUS.OFFLINE,
          message: 'Device went offline',
        });
      }
    }

    return devices;
  }
}

module.exports = new SensorService();
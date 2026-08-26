const DrivingSession = require('../models/DrivingSession');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const DrivingEvent = require('../models/DrivingEvent');
const Sensor = require('../models/Sensor');
const { calculateDistance, calculateAverageSpeed } = require('../utils/calculations');
const { SESSION_STATUS, SENSOR_TYPES, SENSOR_STATUS } = require('../utils/constants');
const { emitToUser, emitToSession, broadcast } = require('../config/socket');
const scoringService = require('./scoringService');
const alertService = require('./alertService');

class DrivingService {
  async startSession(userId, data) {
    const user = await User.findById(userId).populate('vehicleId');
    if (!user) throw new Error('User not found');

    let vehicleId = data.vehicleId;
    if (!vehicleId && user.vehicleId) {
      vehicleId = user.vehicleId._id;
    }

    if (!vehicleId) {
      throw new Error('No vehicle assigned');
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const activeSession = await DrivingSession.findOne({ userId, status: SESSION_STATUS.ACTIVE });
    if (activeSession) {
      throw new Error('Active session already exists');
    }

    const session = await DrivingSession.create({
      userId,
      vehicleId,
      startTime: new Date(),
      startLocation: data.startLocation,
      speedLimit: data.speedLimit || 60,
      status: SESSION_STATUS.ACTIVE,
      route: [
        {
          coordinates: data.startLocation.coordinates,
          timestamp: new Date(),
          speed: 0,
        },
      ],
    });

    await User.findByIdAndUpdate(userId, { $inc: { totalTrips: 1 } });

    await this.updateSensorStatus(vehicleId, SENSOR_STATUS.ONLINE);

    emitToUser(userId, 'driving:start', session);
    emitToSession(session._id.toString(), 'driving:start', session);

    return session;
  }

  async getActiveSession(userId) {
    return DrivingSession.findOne({ userId, status: SESSION_STATUS.ACTIVE })
      .populate('vehicleId')
      .populate('violations');
  }

  async endSession(userId, data) {
    const session = await DrivingSession.findOne({ userId, status: SESSION_STATUS.ACTIVE });
    if (!session) throw new Error('No active session found');

    const endTime = new Date();
    const durationMinutes = (endTime - session.startTime) / (1000 * 60);

    let distance = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;
    let speedCount = 0;

    if (data.endLocation && session.startLocation) {
      distance = calculateDistance(
        session.startLocation.coordinates[1],
        session.startLocation.coordinates[0],
        data.endLocation.coordinates[1],
        data.endLocation.coordinates[0]
      );
    }

    if (session.route && session.route.length > 1) {
      for (let i = 1; i < session.route.length; i++) {
        const segmentDistance = calculateDistance(
          session.route[i - 1].coordinates[1],
          session.route[i - 1].coordinates[0],
          session.route[i].coordinates[1],
          session.route[i].coordinates[0]
        );
        distance += segmentDistance;
        if (session.route[i].speed > maxSpeed) maxSpeed = session.route[i].speed;
        totalSpeed += session.route[i].speed;
        speedCount++;
      }
    }

    const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

    session.endTime = endTime;
    session.endLocation = data.endLocation;
    session.distance = Math.round(distance * 100) / 100;
    session.averageSpeed = Math.round(averageSpeed * 10) / 10;
    session.maxSpeed = Math.round(maxSpeed * 10) / 10;
    session.status = SESSION_STATUS.COMPLETED;

    await session.save();

    await User.findByIdAndUpdate(userId, {
      $inc: { totalDistance: session.distance, safeTrips: session.safetyScore >= 70 ? 1 : 0 },
    });

    await this.updateSensorStatus(session.vehicleId, SENSOR_STATUS.OFFLINE);

    emitToUser(userId, 'driving:end', session);
    emitToSession(session._id.toString(), 'driving:end', session);

    return session;
  }

  async getHistory(userId, query = {}) {
    const { page = 1, limit = 20, startDate, endDate, minScore, maxScore, status } = query;
    const filter = { userId };

    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    if (minScore || maxScore) {
      filter.safetyScore = {};
      if (minScore) filter.safetyScore.$gte = parseInt(minScore);
      if (maxScore) filter.safetyScore.$lte = parseInt(maxScore);
    }

    if (status) filter.status = status;

    const sessions = await DrivingSession.find(filter)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('vehicleId', 'vehicleNumber vehicleType')
      .populate('violations', 'type severity pointsDeducted');

    const total = await DrivingSession.countDocuments(filter);

    return {
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSessionById(userId, sessionId) {
    return DrivingSession.findOne({ _id: sessionId, userId })
      .populate('vehicleId')
      .populate('violations');
  }

  async getStats(userId) {
    const sessions = await DrivingSession.find({ userId, status: SESSION_STATUS.COMPLETED });
    const { calculateTripStats } = require('../utils/calculations');
    return calculateTripStats(sessions);
  }

  async updateSessionData(sessionId, data) {
    const session = await DrivingSession.findById(sessionId);
    if (!session || session.status !== SESSION_STATUS.ACTIVE) return null;

    if (data.speed !== undefined) {
      session.route.push({
        coordinates: data.location?.coordinates || session.startLocation.coordinates,
        timestamp: new Date(),
        speed: data.speed,
      });

      if (data.speed > session.maxSpeed) {
        session.maxSpeed = data.speed;
      }

      if (data.speedLimit && data.speed > data.speedLimit * 1.1) {
        await scoringService.processViolation(session.userId, sessionId, 'OVERSPEED', {
          speed: data.speed,
          speedLimit: data.speedLimit,
          location: data.location,
        });
        await alertService.createOverspeedAlert(session.userId, sessionId, data.speed, data.speedLimit);
      } else if (data.speedLimit && data.speed > data.speedLimit * 0.9) {
        await alertService.createSpeedWarning(session.userId, sessionId, data.speed, data.speedLimit);
      }
    }

    if (data.helmetStatus !== undefined) {
      session.helmetCompliance = data.helmetStatus ? 100 : 0;
      if (data.helmetStatus) {
        await scoringService.processSafeBehavior(session.userId, sessionId, 'HELMET_COMPLIANCE', {
          location: data.location,
        });
      } else {
        await scoringService.processViolation(session.userId, sessionId, 'NO_HELMET', {
          location: data.location,
        });
      }
      await alertService.createHelmetAlert(session.userId, sessionId, data.helmetStatus);
    }

    if (data.seatBeltStatus !== undefined) {
      session.seatBeltCompliance = data.seatBeltStatus ? 100 : 0;
      if (data.seatBeltStatus) {
        await scoringService.processSafeBehavior(session.userId, sessionId, 'SEATBELT_COMPLIANCE', {
          location: data.location,
        });
      } else {
        await scoringService.processViolation(session.userId, sessionId, 'NO_SEATBELT', {
          location: data.location,
        });
      }
      await alertService.createSeatbeltAlert(session.userId, sessionId, data.seatBeltStatus);
    }

    if (data.phoneUsage !== undefined) {
      session.phoneUsage = data.phoneUsage ? 1 : 0;
      if (data.phoneUsage) {
        await scoringService.processViolation(session.userId, sessionId, 'PHONE_USAGE', {
          location: data.location,
          confidence: data.confidence,
        });
        await alertService.createPhoneAlert(session.userId, sessionId, data.confidence || 0.9);
      }
    }

    if (data.harshBraking) {
      session.harshBrakingCount += 1;
      await scoringService.processViolation(session.userId, sessionId, 'HARSH_BRAKING', {
        location: data.location,
      });
    }

    if (data.rashDriving) {
      session.rashDrivingCount += 1;
      await scoringService.processViolation(session.userId, sessionId, 'RASH_DRIVING', {
        location: data.location,
      });
    }

    if (data.drowsiness) {
      session.drowsinessDetected += 1;
      await scoringService.processViolation(session.userId, sessionId, 'DROWSINESS', {
        location: data.location,
        confidence: data.confidence,
      });
      await alertService.createDrowsinessAlert(session.userId, sessionId, data.confidence || 0.9);
    }

    await session.save();

    const realTimeData = {
      speed: data.speed || 0,
      speedLimit: data.speedLimit || session.speedLimit,
      helmet: data.helmetStatus ? 'SAFE' : 'DANGER',
      phone: data.phoneUsage ? 'DANGER' : 'SAFE',
      seatBelt: data.seatBeltStatus ? 'SAFE' : 'DANGER',
      brake: data.harshBraking ? 'DANGER' : 'SAFE',
      drowsiness: data.drowsiness ? 'DANGER' : 'SAFE',
      safetyScore: session.safetyScore,
      points: await User.findById(session.userId).then((u) => u?.totalPoints || 0),
    };

    emitToSession(sessionId.toString(), 'safety:update', realTimeData);
    emitToSession(sessionId.toString(), 'speed:update', { speed: data.speed, speedLimit: data.speedLimit });

    return session;
  }

  async updateSensorStatus(vehicleId, status) {
    await Sensor.updateMany(
      { userId: (await Vehicle.findById(vehicleId)).userId },
      { status, lastUpdated: new Date() }
    );
  }

  async getSensorStatus(userId) {
    return Sensor.find({ userId, isActive: true }).sort({ type: 1 });
  }
}

module.exports = new DrivingService();
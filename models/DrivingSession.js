const mongoose = require('mongoose');

const drivingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    startLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
    },
    endLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
      address: String,
    },
    distance: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageSpeed: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxSpeed: {
      type: Number,
      default: 0,
      min: 0,
    },
    speedLimit: {
      type: Number,
      default: 60,
    },
    safetyScore: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    pointsDeducted: {
      type: Number,
      default: 0,
    },
    helmetCompliance: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    seatBeltCompliance: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    phoneUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    harshBrakingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rashDrivingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    drowsinessDetected: {
      type: Number,
      default: 0,
      min: 0,
    },
    violations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Violation',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'EMERGENCY'],
      default: 'ACTIVE',
    },
    route: [
      {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number],
        timestamp: Date,
        speed: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

drivingSessionSchema.index({ userId: 1, startTime: -1 });
drivingSessionSchema.index({ vehicleId: 1 });
drivingSessionSchema.index({ status: 1 });
drivingSessionSchema.index({ startTime: -1 });
drivingSessionSchema.index({ 'startLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('DrivingSession', drivingSessionSchema);
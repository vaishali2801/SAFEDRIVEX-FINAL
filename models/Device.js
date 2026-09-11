const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    name: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['ESP32', 'RASPBERRY_PI', 'ARDUINO', 'MOBILE_APP', 'OTHER'],
      default: 'ESP32',
    },
    firmwareVersion: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'],
      default: 'OFFLINE',
    },
    lastSeen: {
      type: Date,
    },
    ipAddress: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],
    },
    sensors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor',
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ userId: 1 });
deviceSchema.index({ vehicleId: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ lastSeen: -1 });

module.exports = mongoose.model('Device', deviceSchema);
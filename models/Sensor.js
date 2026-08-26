const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'GPS',
        'CAMERA',
        'ACCELEROMETER',
        'GYROSCOPE',
        'HELMET',
        'SEATBELT',
        'ALCOHOL',
        'EYE',
        'RAIN',
        'ULTRASONIC',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'WARNING', 'ERROR'],
      default: 'OFFLINE',
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
    },
    unit: {
      type: String,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
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

sensorSchema.index({ deviceId: 1, type: 1 }, { unique: true });
sensorSchema.index({ userId: 1 });
sensorSchema.index({ status: 1 });
sensorSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('Sensor', sensorSchema);
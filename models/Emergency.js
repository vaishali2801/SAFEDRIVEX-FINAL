const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    drivingSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DrivingSession',
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    address: {
      type: String,
    },
    contact: {
      name: String,
      phone: String,
      relation: String,
    },
    triggerType: {
      type: String,
      enum: [
        'MANUAL_SOS',
        'CRASH_DETECTED',
        'HARSH_IMPACT',
        'DROWSINESS_CRITICAL',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['TRIGGERED', 'CONTACTED', 'RESOLVED'],
      default: 'TRIGGERED',
    },
    resolvedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

emergencySchema.index({ userId: 1, createdAt: -1 });
emergencySchema.index({ drivingSessionId: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ triggerType: 1 });

module.exports = mongoose.model('Emergency', emergencySchema);
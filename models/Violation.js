const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
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
    drivingEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DrivingEvent',
    },
    type: {
      type: String,
      enum: [
        'NO_HELMET',
        'NO_SEATBELT',
        'PHONE_USAGE',
        'OVERSPEED',
        'WRONG_SIDE',
        'SIGNAL_JUMP',
        'RASH_DRIVING',
        'DRINK_DRIVING',
        'DROWSINESS',
        'HARSH_BRAKING',
        'LANE_DEPARTURE',
        'ALCOHOL_DETECTED',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['WARNING', 'CRITICAL'],
      default: 'WARNING',
    },
    pointsDeducted: {
      type: Number,
      required: true,
      min: 1,
    },
    scoreDeducted: {
      type: Number,
      required: true,
      min: 1,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],
      address: String,
    },
    speed: {
      type: Number,
    },
    speedLimit: {
      type: Number,
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

violationSchema.index({ userId: 1, createdAt: -1 });
violationSchema.index({ drivingSessionId: 1 });
violationSchema.index({ type: 1 });
violationSchema.index({ severity: 1 });
violationSchema.index({ isResolved: 1 });

module.exports = mongoose.model('Violation', violationSchema);
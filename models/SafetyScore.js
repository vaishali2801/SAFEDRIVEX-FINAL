const mongoose = require('mongoose');

const safetyScoreSchema = new mongoose.Schema(
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
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    previousScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    change: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      enum: [
        'HELMET_COMPLIANCE',
        'SEATBELT_COMPLIANCE',
        'SPEED_COMPLIANCE',
        'NO_PHONE_USAGE',
        'SMOOTH_DRIVING',
        'SAFE_BRAKING',
        'TRAFFIC_SIGNAL_COMPLIANCE',
        'SAFE_DISTANCE',
        'DAILY_CHALLENGE',
        'WEEKLY_SAFE_DRIVER',
        'HELMET_VIOLATION',
        'SEATBELT_VIOLATION',
        'PHONE_USAGE',
        'OVERSPEED',
        'WRONG_SIDE',
        'SIGNAL_JUMP',
        'RASH_DRIVING',
        'DRINK_DRIVING',
        'DROWSINESS',
      ],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

safetyScoreSchema.index({ userId: 1, createdAt: -1 });
safetyScoreSchema.index({ drivingSessionId: 1 });
safetyScoreSchema.index({ reason: 1 });

module.exports = mongoose.model('SafetyScore', safetyScoreSchema);
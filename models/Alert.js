const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        'SPEED_WARNING',
        'OVERSPEED',
        'PHONE_DETECTED',
        'NO_HELMET',
        'NO_SEATBELT',
        'HARSH_BRAKING',
        'DROWSINESS',
        'RASH_DRIVING',
        'WRONG_SIDE',
        'SIGNAL_JUMP',
        'ALCOHOL_DETECTED',
        'EMERGENCY',
        'HELMET_REMINDER',
        'SEATBELT_REMINDER',
        'SAFE_DRIVING',
        'POINTS_EARNED',
        'REWARD_AVAILABLE',
        'ACHIEVEMENT_UNLOCKED',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'INFO',
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ drivingSessionId: 1 });
alertSchema.index({ type: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ isRead: 1 });

module.exports = mongoose.model('Alert', alertSchema);
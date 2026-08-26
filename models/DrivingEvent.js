const mongoose = require('mongoose');

const drivingEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    drivingSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DrivingSession',
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        'HELMET_VERIFIED',
        'SEATBELT_VERIFIED',
        'SAFE_SPEED',
        'PHONE_DETECTED',
        'OVERSPEED',
        'SAFE_BRAKING',
        'HARSH_BRAKING',
        'DROWSINESS',
        'RASH_DRIVING',
        'SIGNAL_COMPLIANCE',
        'WRONG_SIDE',
        'EMERGENCY',
        'ALCOHOL_DETECTED',
        'LANE_DEPARTURE',
      ],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
    },
    pointsChange: {
      type: Number,
      default: 0,
    },
    scoreChange: {
      type: Number,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

drivingEventSchema.index({ userId: 1, timestamp: -1 });
drivingEventSchema.index({ drivingSessionId: 1, timestamp: -1 });
drivingEventSchema.index({ eventType: 1 });
drivingEventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('DrivingEvent', drivingEventSchema);
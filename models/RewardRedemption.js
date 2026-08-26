const mongoose = require('mongoose');

const rewardRedemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      required: true,
    },
    pointsDeducted: {
      type: Number,
      required: true,
      min: 1,
    },
    redemptionCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'USED', 'EXPIRED'],
      default: 'PENDING',
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
    },
    expiryDate: {
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

rewardRedemptionSchema.index({ userId: 1, createdAt: -1 });
rewardRedemptionSchema.index({ rewardId: 1 });
rewardRedemptionSchema.index({ redemptionCode: 1 });
rewardRedemptionSchema.index({ status: 1 });

module.exports = mongoose.model('RewardRedemption', rewardRedemptionSchema);
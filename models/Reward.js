const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Reward name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    pointsRequired: {
      type: Number,
      required: [true, 'Points required is required'],
      min: [1, 'Points required must be at least 1'],
    },
    category: {
      type: String,
      enum: ['FOOD', 'FUEL', 'SHOPPING', 'SERVICE', 'INSURANCE', 'OTHER'],
      default: 'OTHER',
    },
    image: {
      type: String,
      default: '',
    },
    stock: {
      type: Number,
      default: -1,
      min: -1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    terms: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index({ isActive: 1, pointsRequired: 1 });
rewardSchema.index({ category: 1 });

module.exports = mongoose.model('Reward', rewardSchema);
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['MOTORCYCLE', 'CAR', 'COMMERCIAL'],
      required: [true, 'Vehicle type is required'],
    },
    brand: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1990,
      max: new Date().getFullYear() + 1,
    },
    deviceId: {
      type: String,
      trim: true,
      uppercase: true,
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

vehicleSchema.index({ userId: 1 });
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
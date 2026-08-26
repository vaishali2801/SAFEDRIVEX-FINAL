const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    safetyScore: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    totalTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    safeTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    achievements: [
      {
        name: String,
        description: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ totalPoints: -1 });
userSchema.index({ safetyScore: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
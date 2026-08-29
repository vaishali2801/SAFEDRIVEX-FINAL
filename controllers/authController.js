const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/response');
const { USER_ROLES } = require('../utils/constants');

const register = async (req, res) => {
  try {
    const { name, email, mobile, password, licenseNumber, vehicleNumber, vehicleType } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return errorResponse(res, 'User with this email or mobile already exists', null, 409);
    }

    const existingVehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
    if (existingVehicle) {
      return errorResponse(res, 'Vehicle number already registered', null, 409);
    }

    // Create user first so we have a userId for the vehicle
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      licenseNumber: licenseNumber?.toUpperCase(),
      role: USER_ROLES.USER,
    });

    const vehicle = await Vehicle.create({
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      userId: user._id,
    });

    user.vehicleId = vehicle._id;
    await user.save();

    const token = generateToken({ userId: user._id, role: user.role });

    return successResponse(
      res,
      'Registration successful',
      {
        token,
        user: user.toJSON(),
      },
      201
    );
  } catch (error) {
    return errorResponse(res, 'Registration failed', error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, 'Account is deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({ userId: user._id, role: user.role });

    return successResponse(res, 'Login successful', {
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return errorResponse(res, 'Login failed', error);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('vehicleId');
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }
    return successResponse(res, 'User profile fetched', user.toJSON());
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', error);
  }
};

const logout = async (req, res) => {
  return successResponse(res, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
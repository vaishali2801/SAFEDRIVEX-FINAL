const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const DrivingSession = require('../models/DrivingSession');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response');
const { calculateTripStats } = require('../utils/calculations');
const { SESSION_STATUS } = require('../utils/constants');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('vehicleId');
    if (!user) return notFoundResponse(res, 'User not found');
    return successResponse(res, 'Profile fetched', user.toJSON());
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, mobile, licenseNumber } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, mobile, licenseNumber: licenseNumber?.toUpperCase() },
      { new: true, runValidators: true }
    ).populate('vehicleId');
    if (!user) return notFoundResponse(res, 'User not found');
    return successResponse(res, 'Profile updated', user.toJSON());
  } catch (error) {
    return errorResponse(res, 'Failed to update profile', error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');
    if (!user) return notFoundResponse(res, 'User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 'Current password is incorrect', null, 400);

    user.password = newPassword;
    await user.save();

    return successResponse(res, 'Password changed successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to change password', error);
  }
};

const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('totalTrips safeTrips totalDistance totalPoints safetyScore achievements');
    if (!user) return notFoundResponse(res, 'User not found');

    const sessions = await DrivingSession.find({ userId: req.userId, status: SESSION_STATUS.COMPLETED });
    const tripStats = calculateTripStats(sessions);

    return successResponse(res, 'Stats fetched', {
      ...user.toJSON(),
      ...tripStats,
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch stats', error);
  }
};

const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.userId });
    return successResponse(res, 'Vehicles fetched', vehicles);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch vehicles', error);
  }
};

const addVehicle = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, brand, model, year } = req.body;

    const existingVehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
    if (existingVehicle) {
      return errorResponse(res, 'Vehicle number already registered', null, 409);
    }

    const vehicle = await Vehicle.create({
      userId: req.userId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      brand,
      model,
      year,
    });

    return successResponse(res, 'Vehicle added', vehicle, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to add vehicle', error);
  }
};

const setPrimaryVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.userId });
    if (!vehicle) return notFoundResponse(res, 'Vehicle not found');

    await User.findByIdAndUpdate(req.userId, { vehicleId });
    return successResponse(res, 'Primary vehicle updated', vehicle);
  } catch (error) {
    return errorResponse(res, 'Failed to set primary vehicle', error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getStats,
  getVehicles,
  addVehicle,
  setPrimaryVehicle,
};
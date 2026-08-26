const { body, query, param, validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/response');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationErrorResponse(res, 'Validation failed', errors.array());
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid Indian mobile number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Password must contain at least one uppercase, lowercase, number and special character'),
  body('licenseNumber').optional().trim().isLength({ max: 20 }).withMessage('License number too long'),
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required').matches(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/).withMessage('Invalid vehicle number format'),
  body('vehicleType').isIn(['MOTORCYCLE', 'CAR', 'COMMERCIAL']).withMessage('Invalid vehicle type'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const startDrivingValidation = [
  body('startLocation.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('startLocation.coordinates.*').isFloat({ min: -180, max: 180 }).withMessage('Invalid coordinates'),
  body('startLocation.address').optional().isString(),
  body('vehicleId').optional().isMongoId().withMessage('Invalid vehicle ID'),
  handleValidationErrors,
];

const endDrivingValidation = [
  body('endLocation.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('endLocation.coordinates.*').isFloat({ min: -180, max: 180 }).withMessage('Invalid coordinates'),
  body('endLocation.address').optional().isString(),
  handleValidationErrors,
];

const sensorDataValidation = [
  body('deviceId').trim().notEmpty().withMessage('Device ID is required'),
  body('sensorType').isIn(['GPS', 'CAMERA', 'ACCELEROMETER', 'GYROSCOPE', 'HELMET', 'SEATBELT', 'ALCOHOL', 'EYE', 'RAIN', 'ULTRASONIC']).withMessage('Invalid sensor type'),
  body('value').notEmpty().withMessage('Sensor value is required'),
  handleValidationErrors,
];

const aiDetectionValidation = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('detected').isBoolean().withMessage('Detected must be boolean'),
  body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
  handleValidationErrors,
];

const rewardRedemptionValidation = [
  param('id').isMongoId().withMessage('Invalid reward ID'),
  handleValidationErrors,
];

const profileUpdateValidation = [
  body('name').optional().trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('mobile').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid mobile number'),
  body('licenseNumber').optional().trim().isLength({ max: 20 }),
  handleValidationErrors,
];

const passwordChangeValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('New password must contain uppercase, lowercase, number and special character'),
  handleValidationErrors,
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isString(),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  handleValidationErrors,
];

const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  handleValidationErrors,
];

const emergencyValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('triggerType').isIn(['MANUAL_SOS', 'CRASH_DETECTED', 'HARSH_IMPACT', 'DROWSINESS_CRITICAL']).withMessage('Invalid trigger type'),
  body('contact.name').optional().isString(),
  body('contact.phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('contact.relation').optional().isString(),
  handleValidationErrors,
];

const demoValidation = [
  body('stage').isIn(['STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4', 'STAGE_5']).withMessage('Invalid demo stage'),
  handleValidationErrors,
];

const simulationValidation = [
  body('mode').isIn(['safe', 'warning', 'violation', 'emergency']).withMessage('Invalid simulation mode'),
  body('type').optional().isIn(['PHONE_USAGE', 'OVERSPEED', 'NO_HELMET', 'NO_SEATBELT', 'HARSH_BRAKING', 'DROWSINESS', 'RASH_DRIVING', 'WRONG_SIDE', 'SIGNAL_JUMP', 'ALCOHOL_DETECTED']).withMessage('Invalid violation type'),
  handleValidationErrors,
];

const adminUserStatusValidation = [
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
  handleValidationErrors,
];

const rewardValidation = [
  body('name').trim().notEmpty().withMessage('Reward name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
  body('pointsRequired').isInt({ min: 1 }).withMessage('Points required must be positive integer'),
  body('category').isIn(['FOOD', 'FUEL', 'SHOPPING', 'SERVICE', 'INSURANCE', 'OTHER']).withMessage('Invalid category'),
  body('stock').optional().isInt({ min: -1 }).withMessage('Stock must be -1 (unlimited) or positive'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
  body('validUntil').optional().isISO8601().withMessage('Invalid date format'),
  body('terms').optional().isString(),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  startDrivingValidation,
  endDrivingValidation,
  sensorDataValidation,
  aiDetectionValidation,
  rewardRedemptionValidation,
  profileUpdateValidation,
  passwordChangeValidation,
  paginationValidation,
  dateRangeValidation,
  emergencyValidation,
  demoValidation,
  simulationValidation,
  adminUserStatusValidation,
  rewardValidation,
};
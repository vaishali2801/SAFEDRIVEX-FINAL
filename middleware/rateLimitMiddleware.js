// const rateLimit = require('express-rate-limit');
// const { errorResponse } = require('../utils/response');

// const createRateLimiter = (windowMs, max, message) => {
//   return rateLimit({
//     windowMs,
//     max,
//     message: { success: false, message: message || 'Too many requests, please try again later' },
//     standardHeaders: true,
//     legacyHeaders: false,
//     handler: (req, res) => {
//       return errorResponse(res, message || 'Too many requests, please try again later', null, 429);
//     },
//   });
// };

// const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later');

// const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts, please try again later');

// const apiLimiter = createRateLimiter(15 * 60 * 1000, 200, 'Too many API requests, please try again later');

// const sensorLimiter = createRateLimiter(1 * 60 * 1000, 60, 'Too many sensor data requests');

// const aiLimiter = createRateLimiter(1 * 60 * 1000, 30, 'Too many AI detection requests');

// const demoLimiter = createRateLimiter(60 * 60 * 1000, 5, 'Demo limit reached, please try again later');

// const simulationLimiter = createRateLimiter(1 * 60 * 1000, 10, 'Too many simulation requests');

// const rewardLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Too many reward requests');

// const emergencyLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Emergency SOS limit reached');

// module.exports = {
//   generalLimiter,
//   authLimiter,
//   apiLimiter,
//   sensorLimiter,
//   aiLimiter,
//   demoLimiter,
//   simulationLimiter,
//   rewardLimiter,
//   emergencyLimiter,
// };

const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

const simulationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many simulation requests. Please try again later.',
  },
});

const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many demo requests. Please try again later.',
  },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many AI requests. Please try again later.',
  },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many API requests. Please try again later.',
  },
});
const rewardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many reward requests. Please try again later.',
  },
});
const emergencyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Emergency SOS limit reached. Please try again later.',
  },
});
const sensorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many sensor data requests. Please try again later.',
  },
});

module.exports = {
  apiLimiter,
  generalLimiter,
  authLimiter,
  simulationLimiter,
  demoLimiter,
  aiLimiter,
  rewardLimiter,
  emergencyLimiter,
  sensorLimiter
};
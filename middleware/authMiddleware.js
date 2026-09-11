const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/response');
const { USER_ROLES } = require('../utils/constants');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return unauthorizedResponse(res, 'Not authorized to access this route');
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return unauthorizedResponse(res, 'User no longer exists');
      }

      if (!user.isActive) {
        return forbiddenResponse(res, 'Account is deactivated');
      }

      req.user = user;
      req.userId = user._id;
      next();
    } catch (error) {
      return unauthorizedResponse(res, 'Not authorized, token failed');
    }
  } catch (error) {
    return forbiddenResponse(res, 'Authentication failed');
  }
};

const adminOnly = async (req, res, next) => {
  if (req.user && req.user.role === USER_ROLES.ADMIN) {
    next();
  } else {
    return forbiddenResponse(res, 'Admin access required');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Token invalid, continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  adminOnly,
  optionalAuth,
};
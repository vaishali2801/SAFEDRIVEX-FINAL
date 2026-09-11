const { errorResponse, notFoundResponse } = require('../utils/response');
const { NODE_ENV } = require('../config/env');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 'Validation Error', messages.join(', '), 400);
  }

  if (err.name === 'CastError') {
    return errorResponse(res, 'Invalid ID format', null, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `${field} already exists`, null, 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', null, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', null, 401);
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File too large', null, 400);
    }
    return errorResponse(res, 'File upload error', err.message, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (NODE_ENV === 'development') {
    return errorResponse(res, message, err.stack, statusCode);
  }

  return errorResponse(res, message, null, statusCode);
};

const notFound = (req, res, next) => {
  return notFoundResponse(res, `Route ${req.originalUrl} not found`);
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFound,
  AppError,
};
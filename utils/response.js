const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message, error = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
  };

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      response.error = error.message || error;
    } else {
      response.error = 'Internal server error';
    }
  }

  return res.status(statusCode).json(response);
};

const validationErrorResponse = (res, message, errors) => {
  return res.status(422).json({
    success: false,
    message,
    errors,
  });
};

const notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message,
  });
};

const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message,
  });
};

const forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
};
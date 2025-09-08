const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorConverter = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    const message = messages.join(', ') || 'Validation error';
    error = new ApiError(httpStatus.BAD_REQUEST, message, false, err.stack);
  }

  // Handle Mongo duplicate key errors
  if (err.code && err.code === 11000) {
    const fields = Object.keys(err.keyValue);
    const message = `Duplicate value for field(s): ${fields.join(', ')}`;
    error = new ApiError(httpStatus.BAD_REQUEST, message, false, err.stack);
  }

  // Wrap non-ApiErrors
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

function handleMongooseError(error) {
  console.log('handleMongooseError');

  if (error.name === 'ValidationError') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `ValidationError: ${error.message}`
    );
  } else if (error.code && error.code === 11000) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Duplicate key error: ${JSON.stringify(error.keyValue)}`
    );
  } else {
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      type: 'UnexpectedError',
      errors: [
        {
          message: error.message || 'An unexpected error occurred',
        },
      ],
    };
  }
}

module.exports = {
  errorConverter,
  errorHandler,
  handleMongooseError,
};

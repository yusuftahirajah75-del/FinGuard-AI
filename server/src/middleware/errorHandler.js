import logger from '../utils/logger.js';
import config from '../config/config.js';

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific PostgreSQL error codes
  if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    message = 'Resource conflict: a record with these unique identifiers already exists.';
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    message = 'Referential integrity violation: referenced record does not exist.';
  } else if (err.code === '22P02') {
    // Invalid text representation (e.g. invalid UUID format)
    statusCode = 400;
    message = 'Invalid parameter format: expected valid UUID.';
  }

  if (statusCode >= 500) {
    logger.error('Unhandled Server Exception', {
      method: req.method,
      path: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn('Client Request Error', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message,
    });
  }

  const responseBody = {
    success: false,
    message,
    ...(config.isDev ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(responseBody);
}

export default errorHandler;


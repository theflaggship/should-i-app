// middleware/errorHandler.js
const winston = require('winston');

// Create a logger instance with Winston
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Log errors to the console
    new winston.transports.Console(),
    // Also log errors to a file (optional)
    new winston.transports.File({ filename: 'error.log' })
  ]
});

module.exports = (err, req, res, next) => {
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  // Determine the status code (use err.status if set, otherwise default to 500)
  const statusCode = err.status || 500;
  
  // Respond with a consistent error object
  res.status(statusCode).json({
    error: {
      message: err.message || 'An unexpected error occurred.'
      // Optionally include more error info in development mode
      // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }
  });
};

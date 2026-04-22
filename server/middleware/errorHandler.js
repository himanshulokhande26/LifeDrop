/**
 * Global Error Handler Middleware
 * --------------------------------
 * Catches errors thrown by any route handler or passed via next(err).
 * Must be registered AFTER all routes in Express.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error(`❌ [${req.method}] ${req.originalUrl} →`, err.message);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Stack trace only in dev mode
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;

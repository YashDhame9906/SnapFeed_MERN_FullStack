const mongoose = require('mongoose');
const { sendError } = require('../utils/response');

/**
 * Middleware that ensures an active MongoDB connection exists before executing queries.
 * Prevents requests from hanging indefinitely on buffering timeouts when MONGO_URI is unset.
 */
const checkDbConnection = (req, res, next) => {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return next();
  }

  return sendError(
    res,
    503,
    'Database connection is not active. Please configure MONGO_URI in Backend/.env and restart the server.'
  );
};

module.exports = checkDbConnection;

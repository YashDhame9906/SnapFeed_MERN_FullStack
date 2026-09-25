const jwt = require('jsonwebtoken');

/**
 * Generate a signed JSON Web Token
 * @param {string} userId - The MongoDB User ID
 * @returns {string} - Signed JWT string
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'snapfeed_fallback_jwt_secret_dev_only';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '30d'
  });
};

module.exports = generateToken;

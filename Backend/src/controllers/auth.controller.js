const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    // Validation: required fields
    if (!username || !email || !password) {
      return sendError(res, 400, 'Please provide username, email, and password');
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    // Validation: username length & characters
    if (username.length < 3 || username.length > 30) {
      return sendError(res, 400, 'Username must be between 3 and 30 characters');
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return sendError(res, 400, 'Username can only contain letters, numbers, underscores, and periods');
    }

    // Validation: email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please provide a valid email address');
    }

    // Validation: password length
    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long');
    }

    // Check if username already exists (case-insensitive)
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    if (existingUsername) {
      return sendError(res, 409, 'Username is already taken');
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return sendError(res, 409, 'An account with this email already exists');
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    const token = generateToken(user._id);

    return sendSuccess(res, 201, 'Account created successfully', {
      user: user.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide both email and password');
    }

    email = email.trim().toLowerCase();

    // Find user and explicitly include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Logged in successfully', {
      user: user.toJSON(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user / invalidate session client-side
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully');
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'Current user profile retrieved', {
    user: req.user
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe
};

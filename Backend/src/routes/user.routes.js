const express = require('express');
const {
  getUserProfile,
  updateProfile,
  getUserFollowers,
  getUserFollowing,
  searchUsers
} = require('../controllers/user.controller');
const {
  followUser,
  unfollowUser
} = require('../controllers/follow.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = express.Router();

// User search - declared before parameterized routes
router.get('/search', optionalAuth, searchUsers);

// Profile editing
router.put('/profile', protect, uploadSingle('profileImage'), updateProfile);

// Follow / Unfollow actions
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

// Followers & Following lists
router.get('/:username/followers', optionalAuth, getUserFollowers);
router.get('/:username/following', optionalAuth, getUserFollowing);

// User profile by username
router.get('/:username', optionalAuth, getUserProfile);

module.exports = router;

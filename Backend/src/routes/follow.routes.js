const express = require('express');
const { followUser, unfollowUser } = require('../controllers/follow.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

module.exports = router;

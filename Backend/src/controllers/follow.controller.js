const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Follow a user
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // Users cannot follow themselves
    if (currentUserId.equals(targetUserId)) {
      return sendError(res, 400, 'You cannot follow yourself');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return sendError(res, 404, 'User not found');
    }

    // Check if already following
    const isAlreadyFollowing = targetUser.followers.some((id) =>
      id.equals(currentUserId)
    );

    if (isAlreadyFollowing) {
      return sendSuccess(res, 200, 'Already following this user', {
        isFollowing: true,
        followersCount: targetUser.followers.length
      });
    }

    // Add target to current user's following list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUserId }
    });

    // Add current user to target user's followers list
    const updatedTargetUser = await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: currentUserId } },
      { new: true }
    );

    return sendSuccess(res, 200, `You are now following @${targetUser.username}`, {
      isFollowing: true,
      followersCount: updatedTargetUser.followers.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unfollow a user
 * @route   POST /api/users/:id/unfollow
 * @access  Private
 */
const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (currentUserId.equals(targetUserId)) {
      return sendError(res, 400, 'You cannot unfollow yourself');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return sendError(res, 404, 'User not found');
    }

    // Remove target from current user's following list
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId }
    });

    // Remove current user from target user's followers list
    const updatedTargetUser = await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: currentUserId } },
      { new: true }
    );

    return sendSuccess(res, 200, `You unfollowed @${targetUser.username}`, {
      isFollowing: false,
      followersCount: updatedTargetUser.followers.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  followUser,
  unfollowUser
};

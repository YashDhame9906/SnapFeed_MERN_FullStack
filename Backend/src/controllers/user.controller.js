const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { uploadToImageKit, deleteFromImageKit } = require('../config/imagekit');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Get user profile by username with their posts
 * @route   GET /api/users/:username
 * @access  Public / Optional Auth
 */
const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const currentUserId = req.user ? req.user._id : null;
    const isCurrentUser = currentUserId ? user._id.equals(currentUserId) : false;
    const isFollowing = currentUserId
      ? user.followers.some((id) => id.equals(currentUserId))
      : false;

    // Fetch user's posts
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username profileImage');

    // Efficient comment counts
    const postIds = posts.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);
    const commentCountMap = {};
    commentCounts.forEach((c) => {
      commentCountMap[c._id.toString()] = c.count;
    });

    const formattedPosts = posts.map((post) => ({
      ...post.toJSON(),
      isAuthor: isCurrentUser,
      likedByCurrentUser: currentUserId
        ? post.likes.some((id) => id.equals(currentUserId))
        : false,
      likeCount: post.likes.length,
      commentsCount: commentCountMap[post._id.toString()] || 0
    }));

    return sendSuccess(res, 200, 'User profile retrieved', {
      user: {
        _id: user._id,
        username: user.username,
        email: isCurrentUser ? user.email : undefined,
        profileImage: user.profileImage,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount: posts.length,
        isCurrentUser,
        isFollowing,
        createdAt: user.createdAt
      },
      posts: formattedPosts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile (username, bio, profileImage)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const { username, bio } = req.body;

    // Handle username update if provided and changed
    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();

      if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        return sendError(res, 400, 'Username must be between 3 and 30 characters');
      }

      const usernameRegex = /^[a-zA-Z0-9_.]+$/;
      if (!usernameRegex.test(cleanUsername)) {
        return sendError(
          res,
          400,
          'Username can only contain letters, numbers, underscores, and periods'
        );
      }

      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') },
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return sendError(res, 409, 'Username is already taken');
      }

      user.username = cleanUsername;
    }

    // Handle bio update
    if (bio !== undefined) {
      if (bio.trim().length > 160) {
        return sendError(res, 400, 'Bio cannot exceed 160 characters');
      }
      user.bio = bio.trim();
    }

    // Handle profile image upload via ImageKit
    if (req.file) {
      const { imageUrl, imageFileId } = await uploadToImageKit(req.file, 'avatars');

      // Purge old avatar from ImageKit if exists
      if (user.profileImageFileId) {
        await deleteFromImageKit(user.profileImageFileId);
      }

      user.profileImage = imageUrl;
      user.profileImageFileId = imageFileId;
    }

    await user.save();

    return sendSuccess(res, 200, 'Profile updated successfully', {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get followers of a user
 * @route   GET /api/users/:username/followers
 * @access  Public / Optional Auth
 */
const getUserFollowers = async (req, res, next) => {
  try {
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${req.params.username}$`, 'i') }
    }).populate('followers', 'username profileImage bio followers');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const currentUserId = req.user ? req.user._id : null;

    const formattedFollowers = user.followers.map((f) => ({
      _id: f._id,
      username: f.username,
      profileImage: f.profileImage,
      bio: f.bio,
      isFollowing: currentUserId ? f.followers.some((id) => id.equals(currentUserId)) : false
    }));

    return sendSuccess(res, 200, 'Followers retrieved', {
      followers: formattedFollowers,
      count: formattedFollowers.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get accounts that a user is following
 * @route   GET /api/users/:username/following
 * @access  Public / Optional Auth
 */
const getUserFollowing = async (req, res, next) => {
  try {
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${req.params.username}$`, 'i') }
    }).populate('following', 'username profileImage bio followers');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const currentUserId = req.user ? req.user._id : null;

    const formattedFollowing = user.following.map((f) => ({
      _id: f._id,
      username: f.username,
      profileImage: f.profileImage,
      bio: f.bio,
      isFollowing: currentUserId ? f.followers.some((id) => id.equals(currentUserId)) : false
    }));

    return sendSuccess(res, 200, 'Following list retrieved', {
      following: formattedFollowing,
      count: formattedFollowing.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users by username
 * @route   GET /api/users/search?q=
 * @access  Public / Optional Auth
 */
const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return sendSuccess(res, 200, 'Empty search query', { users: [] });
    }

    const currentUserId = req.user ? req.user._id : null;

    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    })
      .select('username profileImage bio followers')
      .limit(20);

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      username: u.username,
      profileImage: u.profileImage,
      bio: u.bio,
      followersCount: u.followers.length,
      isFollowing: currentUserId ? u.followers.some((id) => id.equals(currentUserId)) : false
    }));

    return sendSuccess(res, 200, 'Search results', { users: formattedUsers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  getUserFollowers,
  getUserFollowing,
  searchUsers
};

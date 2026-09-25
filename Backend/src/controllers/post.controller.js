const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { uploadToImageKit, deleteFromImageKit } = require('../config/imagekit');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Create a new post with image upload
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please upload an image for the post');
    }

    const caption = req.body.caption ? req.body.caption.trim() : '';

    if (caption.length > 2200) {
      return sendError(res, 400, 'Caption cannot exceed 2200 characters');
    }

    // Upload image to ImageKit (or local fallback)
    const { imageUrl, imageFileId } = await uploadToImageKit(req.file, 'posts');

    // Create post record
    const post = await Post.create({
      author: req.user._id,
      imageUrl,
      imageFileId,
      caption,
      likes: []
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'username profileImage'
    );

    return sendSuccess(res, 201, 'Post created successfully', {
      post: {
        ...populatedPost.toJSON(),
        isAuthor: true,
        likedByCurrentUser: false,
        likeCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single post by ID
 * @route   GET /api/posts/:id
 * @access  Public / Optional Auth
 */
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'username profileImage'
    );

    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    const currentUserId = req.user ? req.user._id : null;
    const isAuthor = currentUserId ? post.author._id.equals(currentUserId) : false;
    const likedByCurrentUser = currentUserId
      ? post.likes.some((likeId) => likeId.equals(currentUserId))
      : false;

    // Fetch comments for this post
    const comments = await Comment.find({ post: post._id })
      .populate('author', 'username profileImage')
      .sort({ createdAt: 1 });

    const formattedComments = comments.map((comment) => ({
      ...comment.toJSON(),
      isAuthor: currentUserId ? comment.author._id.equals(currentUserId) : false
    }));

    return sendSuccess(res, 200, 'Post retrieved successfully', {
      post: {
        ...post.toJSON(),
        isAuthor,
        likedByCurrentUser,
        likeCount: post.likes.length,
        comments: formattedComments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update post caption
 * @route   PUT /api/posts/:id
 * @access  Private (Owner only)
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    // Backend ownership verification
    if (!post.author.equals(req.user._id)) {
      return sendError(res, 403, 'You are not authorized to edit this post');
    }

    const { caption } = req.body;
    if (caption !== undefined) {
      if (caption.trim().length > 2200) {
        return sendError(res, 400, 'Caption cannot exceed 2200 characters');
      }
      post.caption = caption.trim();
    }

    await post.save();

    const updatedPost = await Post.findById(post._id).populate(
      'author',
      'username profileImage'
    );

    return sendSuccess(res, 200, 'Post updated successfully', {
      post: {
        ...updatedPost.toJSON(),
        isAuthor: true,
        likedByCurrentUser: post.likes.some((likeId) => likeId.equals(req.user._id)),
        likeCount: post.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete post, image from ImageKit, and associated comments
 * @route   DELETE /api/posts/:id
 * @access  Private (Owner only)
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    // Backend ownership verification
    if (!post.author.equals(req.user._id)) {
      return sendError(res, 403, 'You are not authorized to delete this post');
    }

    // Delete image from ImageKit
    if (post.imageFileId) {
      await deleteFromImageKit(post.imageFileId);
    }

    // Remove comments belonging to this post
    await Comment.deleteMany({ post: post._id });

    // Remove the post record
    await post.deleteOne();

    return sendSuccess(res, 200, 'Post deleted successfully', {
      deletedPostId: req.params.id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Like a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    const userId = req.user._id;

    // Check if user already liked this post
    const alreadyLiked = post.likes.some((id) => id.equals(userId));
    if (alreadyLiked) {
      return sendSuccess(res, 200, 'Post already liked', {
        likeCount: post.likes.length,
        likedByCurrentUser: true
      });
    }

    // Add user ID to likes array
    post.likes.push(userId);
    await post.save();

    return sendSuccess(res, 200, 'Post liked successfully', {
      likeCount: post.likes.length,
      likedByCurrentUser: true
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlike a post
 * @route   POST /api/posts/:id/unlike
 * @access  Private
 */
const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    const userId = req.user._id;

    // Remove user ID from likes array
    post.likes = post.likes.filter((id) => !id.equals(userId));
    await post.save();

    return sendSuccess(res, 200, 'Post unliked successfully', {
      likeCount: post.likes.length,
      likedByCurrentUser: false
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personalized feed for logged-in user (author + followed users)
 * @route   GET /api/posts
 * @access  Private
 */
const getFeed = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const currentUserId = req.user._id;
    // Current user's posts + posts from users they follow
    const authorIds = [currentUserId, ...(req.user.following || [])];

    const filter = { author: { $in: authorIds } };

    const [posts, totalPosts] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username profileImage'),
      Post.countDocuments(filter)
    ]);

    // Retrieve comment counts efficiently in a single aggregation
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
      isAuthor: post.author._id.equals(currentUserId),
      likedByCurrentUser: post.likes.some((id) => id.equals(currentUserId)),
      likeCount: post.likes.length,
      commentsCount: commentCountMap[post._id.toString()] || 0
    }));

    return sendSuccess(res, 200, 'Personalized feed retrieved', {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasMore: page * limit < totalPosts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public explore feed (recent posts from all users)
 * @route   GET /api/posts/explore
 * @access  Public / Optional Auth
 */
const getExploreFeed = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const currentUserId = req.user ? req.user._id : null;

    const [posts, totalPosts] = await Promise.all([
      Post.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username profileImage'),
      Post.countDocuments({})
    ]);

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
      isAuthor: currentUserId ? post.author._id.equals(currentUserId) : false,
      likedByCurrentUser: currentUserId
        ? post.likes.some((id) => id.equals(currentUserId))
        : false,
      likeCount: post.likes.length,
      commentsCount: commentCountMap[post._id.toString()] || 0
    }));

    return sendSuccess(res, 200, 'Explore feed retrieved', {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasMore: page * limit < totalPosts
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getFeed,
  getExploreFeed
};



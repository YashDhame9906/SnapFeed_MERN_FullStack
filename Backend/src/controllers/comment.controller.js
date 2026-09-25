const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Add a comment to a post
 * @route   POST /api/posts/:id/comments
 * @access  Private
 */
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return sendError(res, 400, 'Comment text cannot be empty');
    }

    if (text.trim().length > 1000) {
      return sendError(res, 400, 'Comment cannot exceed 1000 characters');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim()
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'username profileImage'
    );

    return sendSuccess(res, 201, 'Comment added successfully', {
      comment: {
        ...populatedComment.toJSON(),
        isAuthor: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all comments for a post
 * @route   GET /api/posts/:id/comments
 * @access  Public / Optional Auth
 */
const getPostComments = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 404, 'Post not found');
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'username profileImage')
      .sort({ createdAt: 1 });

    const currentUserId = req.user ? req.user._id : null;

    const formattedComments = comments.map((c) => ({
      ...c.toJSON(),
      isAuthor: currentUserId ? c.author._id.equals(currentUserId) : false,
      canDelete: currentUserId
        ? c.author._id.equals(currentUserId) || post.author.equals(currentUserId)
        : false
    }));

    return sendSuccess(res, 200, 'Comments retrieved successfully', {
      comments: formattedComments,
      count: formattedComments.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment by ID
 * @route   DELETE /api/comments/:id
 * @access  Private (Comment author or post author)
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return sendError(res, 404, 'Comment not found');
    }

    // Check if user is the comment author or post owner
    const post = await Post.findById(comment.post);
    const isCommentAuthor = comment.author.equals(req.user._id);
    const isPostAuthor = post && post.author.equals(req.user._id);

    if (!isCommentAuthor && !isPostAuthor) {
      return sendError(res, 403, 'You are not authorized to delete this comment');
    }

    await comment.deleteOne();

    return sendSuccess(res, 200, 'Comment deleted successfully', {
      deletedCommentId: req.params.id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getPostComments,
  deleteComment
};

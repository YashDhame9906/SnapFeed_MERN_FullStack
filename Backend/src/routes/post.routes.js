const express = require('express');
const {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getFeed,
  getExploreFeed
} = require('../controllers/post.controller');
const {
  addComment,
  getPostComments
} = require('../controllers/comment.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = express.Router();

// Feed & Explore routes
router.get('/', protect, getFeed);
router.get('/explore', optionalAuth, getExploreFeed);

// Post CRUD routes
router.post('/', protect, uploadSingle('image'), createPost);
router.get('/:id', optionalAuth, getPostById);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

// Like / Unlike routes
router.post('/:id/like', protect, likePost);
router.post('/:id/unlike', protect, unlikePost);

// Post Comments routes
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', optionalAuth, getPostComments);

module.exports = router;


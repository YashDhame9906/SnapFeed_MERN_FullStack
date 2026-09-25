const express = require('express');
const { deleteComment } = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Delete a comment (comment author or post author only)
router.delete('/:id', protect, deleteComment);

module.exports = router;

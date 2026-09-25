import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { commentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

const CommentSection = ({ postId, initialComments = [], onCommentCountChange }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await commentApi.addComment(postId, commentText.trim());
      if (response.success && response.data?.comment) {
        const newComments = [...comments, response.data.comment];
        setComments(newComments);
        setCommentText('');
        if (onCommentCountChange) {
          onCommentCountChange(newComments.length);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await commentApi.deleteComment(commentId);
      if (response.success) {
        const updated = comments.filter((c) => c._id !== commentId);
        setComments(updated);
        if (onCommentCountChange) {
          onCommentCountChange(updated.length);
        }
      }
    } catch (err) {
      setError(err.message || 'Could not delete comment');
    }
  };

  const formatCommentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="comment-section">
      {error && <div className="alert-error-sm">{error}</div>}

      {/* Existing Comments List */}
      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="no-comments-text">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => {
            const isOwner =
              user &&
              (comment.author?._id === user._id ||
                comment.author === user._id ||
                comment.isAuthor ||
                comment.canDelete);

            return (
              <div key={comment._id} className="comment-item">
                <Link to={`/profile/${comment.author?.username}`}>
                  <UserAvatar user={comment.author} size="xs" />
                </Link>
                <div className="comment-bubble">
                  <div className="comment-header-line">
                    <Link
                      to={`/profile/${comment.author?.username}`}
                      className="comment-author-name"
                    >
                      @{comment.author?.username}
                    </Link>
                    <span className="comment-time">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    className="btn-delete-comment"
                    onClick={() => handleDeleteComment(comment._id)}
                    title="Delete comment"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Input Form */}
      {isAuthenticated ? (
        <form onSubmit={handleAddComment} className="comment-input-form">
          <input
            type="text"
            className="comment-input"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="btn-post-comment"
            disabled={!commentText.trim() || isSubmitting}
          >
            Post
          </button>
        </form>
      ) : (
        <p className="login-to-comment-hint">
          <Link to="/login">Log in</Link> to join the conversation.
        </p>
      )}
    </div>
  );
};

export default CommentSection;

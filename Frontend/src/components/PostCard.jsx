import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import CommentSection from './CommentSection';

const PostCard = ({ post, onDelete, onUpdate }) => {
  const { user, isAuthenticated } = useAuth();

  const [liked, setLiked] = useState(post.likedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(
    post.commentsCount !== undefined ? post.commentsCount : post.comments?.length || 0
  );
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  const isOwner =
    user &&
    (post.isAuthor ||
      post.author?._id === user._id ||
      post.author === user._id);

  // Toggle Like / Unlike
  const handleLikeToggle = async () => {
    if (!isAuthenticated) return;

    // Optimistic UI update
    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      if (nextLiked) {
        await postApi.likePost(post._id);
      } else {
        await postApi.unlikePost(post._id);
      }
    } catch (err) {
      // Rollback on failure
      setLiked(!nextLiked);
      setLikeCount(likeCount);
      console.warn('Like toggle failed:', err.message);
    }
  };

  // Update caption
  const handleSaveCaption = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setActionError('');

    try {
      const response = await postApi.updatePost(post._id, {
        caption: editedCaption.trim()
      });
      if (response.success) {
        setIsEditing(false);
        if (onUpdate) {
          onUpdate(response.data.post);
        }
      }
    } catch (err) {
      setActionError(err.message || 'Could not update post');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);
    setActionError('');

    try {
      const response = await postApi.deletePost(post._id);
      if (response.success) {
        if (onDelete) {
          onDelete(post._id);
        }
      }
    } catch (err) {
      setActionError(err.message || 'Could not delete post');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <article className="post-card">
      {/* Post Header */}
      <header className="post-header">
        <Link to={`/profile/${post.author?.username}`} className="post-author-link">
          <UserAvatar user={post.author} size="sm" />
          <div className="post-author-meta">
            <span className="post-author-username">@{post.author?.username}</span>
            <time className="post-date">{formatDate(post.createdAt)}</time>
          </div>
        </Link>

        {isOwner && (
          <div className="post-owner-actions">
            <button
              type="button"
              className="post-action-btn"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit caption"
              disabled={isDeleting}
            >
              Edit
            </button>
            <button
              type="button"
              className="post-action-btn btn-danger-text"
              onClick={handleDeletePost}
              title="Delete post"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </header>

      {actionError && <div className="alert-error-sm">{actionError}</div>}

      {/* Post Image */}
      <div className="post-image-wrapper">
        <img
          src={post.imageUrl}
          alt={post.caption || `Post by ${post.author?.username}`}
          className="post-image"
          loading="lazy"
        />
      </div>

      {/* Post Actions Bar */}
      <div className="post-interactions">
        <button
          type="button"
          className={`btn-interaction ${liked ? 'btn-interaction-liked' : ''}`}
          onClick={handleLikeToggle}
          title={liked ? 'Unlike' : 'Like'}
          disabled={!isAuthenticated}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={liked ? '#ef4444' : 'none'}
            stroke={liked ? '#ef4444' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span className="interaction-count">{likeCount}</span>
        </button>

        <button
          type="button"
          className="btn-interaction"
          onClick={() => setShowComments(!showComments)}
          title="Comments"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span className="interaction-count">{commentCount}</span>
        </button>
      </div>

      {/* Caption or Edit Mode */}
      <div className="post-caption-area">
        {isEditing ? (
          <form onSubmit={handleSaveCaption} className="edit-caption-form">
            <textarea
              className="edit-caption-input"
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              rows={2}
              maxLength={2200}
              disabled={isUpdating}
            />
            <div className="edit-caption-actions">
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => {
                  setEditedCaption(post.caption || '');
                  setIsEditing(false);
                }}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-sm"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          post.caption && (
            <p className="post-caption">
              <Link
                to={`/profile/${post.author?.username}`}
                className="caption-author"
              >
                @{post.author?.username}
              </Link>{' '}
              <span className="caption-text">{post.caption}</span>
            </p>
          )
        )}
      </div>

      {/* Expand / Collapse Comment Section */}
      {showComments && (
        <CommentSection
          postId={post._id}
          initialComments={post.comments || []}
          onCommentCountChange={(count) => setCommentCount(count)}
        />
      )}
    </article>
  );
};

export default PostCard;

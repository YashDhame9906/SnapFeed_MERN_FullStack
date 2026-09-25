import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postApi } from '../services/api';
import PostCard from '../components/PostCard';
import UserAvatar from '../components/UserAvatar';
import Loader from '../components/Loader';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'feed'
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchExplorePosts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const response = await postApi.getExplore(pageNum, 12);
      if (response.success && response.data?.posts) {
        if (append) {
          setPosts((prev) => [...prev, ...response.data.posts]);
        } else {
          setPosts(response.data.posts);
        }
        setHasMore(response.data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.message || 'Could not load explore posts.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchExplorePosts(1, false);
  }, [fetchExplorePosts]);

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
    if (selectedPost?._id === deletedPostId) {
      setSelectedPost(null);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p))
    );
    if (selectedPost?._id === updatedPost._id) {
      setSelectedPost(updatedPost);
    }
  };

  return (
    <div className="explore-page-layout">
      <div className="explore-header-bar">
        <div>
          <h1 className="page-title">Explore</h1>
          <p className="page-subtitle">Discover moments from across the community</p>
        </div>

        <div className="view-toggle-buttons">
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Grid</span>
          </button>
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'feed' ? 'active' : ''}`}
            onClick={() => setViewMode('feed')}
            title="Feed View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>Feed</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="feed-status-container">
          <Loader message="Loading explore feed..." />
        </div>
      )}

      {!loading && error && (
        <div className="feed-status-card feed-error-card">
          <p className="feed-status-title">Something went wrong</p>
          <p className="feed-status-desc">{error}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fetchExplorePosts(1, false)}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="feed-status-card feed-empty-card">
          <p className="feed-status-title">No public posts yet</p>
          <p className="feed-status-desc">Be the first to share an image on SnapFeed!</p>
          <Link to="/" className="btn-primary">
            Create Post
          </Link>
        </div>
      )}

      {/* Grid View */}
      {!loading && posts.length > 0 && viewMode === 'grid' && (
        <div className="explore-grid">
          {posts.map((post) => (
            <div
              key={post._id}
              className="explore-grid-item"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={post.imageUrl}
                alt={post.caption || 'Explore post'}
                className="explore-grid-image"
                loading="lazy"
              />
              <div className="explore-grid-overlay">
                <div className="overlay-author">
                  <UserAvatar user={post.author} size="xs" />
                  <span>@{post.author?.username}</span>
                </div>
                <div className="overlay-metrics">
                  <span>♥ {post.likeCount || 0}</span>
                  <span>💬 {post.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed View */}
      {!loading && posts.length > 0 && viewMode === 'feed' && (
        <div className="posts-container explore-feed-container">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handlePostDeleted}
              onUpdate={handlePostUpdated}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="feed-load-more">
          <button
            type="button"
            className="btn-secondary btn-load-more"
            onClick={() => fetchExplorePosts(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading more...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Modal for viewing single post from grid */}
      {selectedPost && (
        <div className="modal-backdrop" onClick={() => setSelectedPost(null)}>
          <div
            className="modal-content post-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn-close-modal"
              onClick={() => setSelectedPost(null)}
            >
              ×
            </button>
            <PostCard
              post={selectedPost}
              onDelete={handlePostDeleted}
              onUpdate={handlePostUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;

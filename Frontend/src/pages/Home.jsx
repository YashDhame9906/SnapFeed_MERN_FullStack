import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postApi } from '../services/api';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const response = await postApi.getFeed(pageNum, 10);
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
      setError(err.message || 'Could not load your feed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p))
    );
  };

  return (
    <div className="feed-page-layout">
      <main className="feed-main-column">
        {/* Feed Loading State */}
        {loading && (
          <div className="feed-status-container">
            <Loader message="Loading your feed..." />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="feed-status-card feed-error-card">
            <p className="feed-status-title">Unable to load feed</p>
            <p className="feed-status-desc">{error}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fetchFeed(1, false)}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="feed-status-card feed-empty-card">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p className="feed-status-title">No posts yet</p>
            <p className="feed-status-desc">
              Your feed is quiet. Share your first photo or follow other creators to see what they are posting!
            </p>
            <Link to="/explore" className="btn-primary">
              Explore Recent Posts
            </Link>
          </div>
        )}

        {/* Posts List */}
        {!loading && posts.length > 0 && (
          <div className="posts-container">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handlePostDeleted}
                onUpdate={handlePostUpdated}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="feed-load-more">
                <button
                  type="button"
                  className="btn-secondary btn-load-more"
                  onClick={() => fetchFeed(page + 1, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading more posts...' : 'Load Older Posts'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

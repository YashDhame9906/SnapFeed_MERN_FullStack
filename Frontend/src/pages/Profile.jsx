import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Modals for followers / following lists
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [relationshipList, setRelationshipList] = useState([]);
  const [relationshipLoading, setRelationshipLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await userApi.getProfile(username);
      if (response.success && response.data) {
        setProfileData(response.data.user);
        setPosts(response.data.posts || []);
        setIsFollowing(response.data.user.isFollowing || false);
        setFollowersCount(response.data.user.followersCount || 0);
      }
    } catch (err) {
      setError(err.message || 'User not found');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !profileData || followLoading) return;

    setFollowLoading(true);
    const nextState = !isFollowing;
    const nextCount = nextState ? followersCount + 1 : Math.max(0, followersCount - 1);

    // Optimistic UI update
    setIsFollowing(nextState);
    setFollowersCount(nextCount);

    try {
      if (nextState) {
        await userApi.followUser(profileData._id);
      } else {
        await userApi.unfollowUser(profileData._id);
      }
    } catch (err) {
      // Revert on error
      setIsFollowing(!nextState);
      setFollowersCount(followersCount);
      console.warn('Follow toggle error:', err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenFollowers = async () => {
    setShowFollowersModal(true);
    setRelationshipLoading(true);
    try {
      const res = await userApi.getFollowers(username);
      if (res.success && res.data?.followers) {
        setRelationshipList(res.data.followers);
      }
    } catch (err) {
      console.warn('Error fetching followers:', err.message);
    } finally {
      setRelationshipLoading(false);
    }
  };

  const handleOpenFollowing = async () => {
    setShowFollowingModal(true);
    setRelationshipLoading(true);
    try {
      const res = await userApi.getFollowing(username);
      if (res.success && res.data?.following) {
        setRelationshipList(res.data.following);
      }
    } catch (err) {
      console.warn('Error fetching following:', err.message);
    } finally {
      setRelationshipLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="profile-loading-wrapper">
        <Loader message={`Loading @${username}...`} />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="profile-error-wrapper">
        <div className="feed-status-card feed-error-card">
          <p className="feed-status-title">Profile not found</p>
          <p className="feed-status-desc">{error || 'This user does not exist.'}</p>
          <Link to="/" className="btn-secondary">
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentUser = profileData.isCurrentUser;

  return (
    <div className="profile-page-layout">
      {/* Profile Header Card */}
      <header className="profile-header-card">
        <div className="profile-avatar-column">
          <UserAvatar user={profileData} size="xl" />
        </div>

        <div className="profile-details-column">
          <div className="profile-title-row">
            <h1 className="profile-username">@{profileData.username}</h1>

            <div className="profile-actions-area">
              {isCurrentUser ? (
                <Link to="/profile/edit" className="btn-secondary">
                  Edit Profile
                </Link>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  className={`btn-action-follow ${isFollowing ? 'following' : 'not-following'}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              ) : (
                <Link to="/login" className="btn-primary">
                  Follow
                </Link>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="profile-stats-bar">
            <div className="stat-item">
              <span className="stat-count">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>

            <button
              type="button"
              className="stat-item stat-button"
              onClick={handleOpenFollowers}
            >
              <span className="stat-count">{followersCount}</span>
              <span className="stat-label">Followers</span>
            </button>

            <button
              type="button"
              className="stat-item stat-button"
              onClick={handleOpenFollowing}
            >
              <span className="stat-count">{profileData.followingCount || 0}</span>
              <span className="stat-label">Following</span>
            </button>
          </div>

          {/* Bio Area */}
          <div className="profile-bio-box">
            {profileData.bio ? (
              <p className="profile-bio-text">{profileData.bio}</p>
            ) : (
              <p className="profile-bio-empty">No bio provided yet.</p>
            )}
          </div>
        </div>
      </header>

      {/* User Posts Grid */}
      <section className="profile-posts-section">
        <div className="section-divider">
          <h2 className="section-title">Posts ({posts.length})</h2>
        </div>

        {posts.length === 0 ? (
          <div className="feed-status-card feed-empty-card">
            <p className="feed-status-title">No posts yet</p>
            <p className="feed-status-desc">
              {isCurrentUser
                ? "You haven't posted any photos yet."
                : `@${profileData.username} hasn't posted any photos yet.`}
            </p>
            {isCurrentUser && (
              <Link to="/" className="btn-primary">
                Create First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="explore-grid">
            {posts.map((post) => (
              <div
                key={post._id}
                className="explore-grid-item"
                onClick={() => setSelectedPost(post)}
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption || 'User post'}
                  className="explore-grid-image"
                  loading="lazy"
                />
                <div className="explore-grid-overlay">
                  <div className="overlay-metrics">
                    <span>♥ {post.likeCount || 0}</span>
                    <span>💬 {post.commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Post Modal */}
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

      {/* Followers Modal */}
      {showFollowersModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowFollowersModal(false)}
        >
          <div
            className="modal-content users-list-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Followers</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowFollowersModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {relationshipLoading ? (
                <Loader message="Loading followers..." />
              ) : relationshipList.length === 0 ? (
                <p className="modal-empty-message">No followers yet.</p>
              ) : (
                <div className="user-relation-list">
                  {relationshipList.map((relUser) => (
                    <div key={relUser._id} className="user-relation-item">
                      <Link
                        to={`/profile/${relUser.username}`}
                        onClick={() => setShowFollowersModal(false)}
                        className="user-relation-link"
                      >
                        <UserAvatar user={relUser} size="sm" />
                        <div>
                          <span className="user-relation-name">
                            @{relUser.username}
                          </span>
                          {relUser.bio && (
                            <p className="user-relation-bio">{relUser.bio}</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowFollowingModal(false)}
        >
          <div
            className="modal-content users-list-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Following</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowFollowingModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {relationshipLoading ? (
                <Loader message="Loading following..." />
              ) : relationshipList.length === 0 ? (
                <p className="modal-empty-message">Not following anyone yet.</p>
              ) : (
                <div className="user-relation-list">
                  {relationshipList.map((relUser) => (
                    <div key={relUser._id} className="user-relation-item">
                      <Link
                        to={`/profile/${relUser.username}`}
                        onClick={() => setShowFollowingModal(false)}
                        className="user-relation-link"
                      >
                        <UserAvatar user={relUser} size="sm" />
                        <div>
                          <span className="user-relation-name">
                            @{relUser.username}
                          </span>
                          {relUser.bio && (
                            <p className="user-relation-bio">{relUser.bio}</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

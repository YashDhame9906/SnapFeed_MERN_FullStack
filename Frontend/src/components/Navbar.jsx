import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import UserAvatar from './UserAvatar';

const Navbar = ({ onOpenCreate }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Live user search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await userApi.searchUsers(searchQuery);
        if (response.success && response.data?.users) {
          setSearchResults(response.data.users);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.warn('Search query error:', err.message);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (username) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    navigate(`/profile/${username}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-dot"></span>
          SnapFeed
        </Link>

        {/* Global user search */}
        <div className="navbar-search" ref={searchRef}>
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showSearchDropdown && (
            <div className="search-dropdown">
              {isSearching ? (
                <div className="search-dropdown-message">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div
                    key={result._id}
                    className="search-item"
                    onClick={() => handleSelectUser(result.username)}
                  >
                    <UserAvatar user={result} size="sm" />
                    <div className="search-item-info">
                      <span className="search-username">@{result.username}</span>
                      {result.bio && (
                        <span className="search-bio">{result.bio}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-dropdown-message">No users found</div>
              )}
            </div>
          )}
        </div>

        {/* Navigation actions */}
        <nav className="navbar-nav">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                title="Feed"
                end
              >
                Feed
              </NavLink>

              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                title="Explore"
              >
                Explore
              </NavLink>

              {onOpenCreate && (
                <button
                  type="button"
                  className="nav-btn-create"
                  onClick={onOpenCreate}
                >
                  <span className="plus-icon">+</span>
                  <span>New Post</span>
                </button>
              )}

              <NavLink
                to={`/profile/${user?.username}`}
                className={({ isActive }) =>
                  `nav-profile-link ${isActive ? 'nav-profile-active' : ''}`
                }
                title="My Profile"
              >
                <UserAvatar user={user} size="sm" />
                <span className="nav-username">@{user?.username}</span>
              </NavLink>

              <button
                type="button"
                className="nav-btn-logout"
                onClick={handleLogout}
                title="Log Out"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="navbar-auth-links">
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

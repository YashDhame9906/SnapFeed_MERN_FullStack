import React from 'react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const username = user?.username || 'User';
  const initial = username.charAt(0).toUpperCase();
  const profileImage = user?.profileImage;

  return (
    <div className={`user-avatar user-avatar-${size} ${className}`} title={username}>
      {profileImage ? (
        <img
          src={profileImage}
          alt={username}
          className="avatar-image"
          onError={(e) => {
            // Graceful fallback to initial if image fails to load
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div
        className="avatar-fallback"
        style={{ display: profileImage ? 'none' : 'flex' }}
      >
        {initial}
      </div>
    </div>
  );
};

export default UserAvatar;

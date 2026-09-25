import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

const EditProfile = () => {
  const { user, updateUserLocal } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Please select an image in JPG, PNG, or WEBP format.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be smaller than 5MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Username cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('username', cleanUsername);
      formData.append('bio', bio.trim());
      if (avatarFile) {
        formData.append('profileImage', avatarFile);
      }

      const response = await userApi.updateProfile(formData);
      if (response.success && response.data?.user) {
        updateUserLocal(response.data.user);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => {
          navigate(`/profile/${response.data.user.username}`);
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-layout">
      <div className="edit-profile-card">
        <div className="edit-profile-header">
          <h1 className="page-title">Edit Profile</h1>
          <p className="page-subtitle">Update your personal information and photo</p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {successMsg && <div className="alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* Avatar Edit Row */}
          <div className="avatar-edit-section">
            <div className="avatar-edit-preview">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="New avatar preview"
                  className="avatar-preview-img"
                />
              ) : (
                <UserAvatar user={user} size="lg" />
              )}
            </div>

            <div className="avatar-edit-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                Change Photo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
              />
              <span className="avatar-hint">JPG, PNG, or WEBP up to 5MB</span>
            </div>
          </div>

          {/* Username Input */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              disabled={isSubmitting}
            />
          </div>

          {/* Bio Input */}
          <div className="form-group">
            <label htmlFor="bio" className="form-label">
              Bio
            </label>
            <textarea
              id="bio"
              className="form-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="Tell others about yourself..."
              disabled={isSubmitting}
            />
            <div className="char-counter-right">{bio.length} / 160</div>
          </div>

          <div className="edit-profile-actions">
            <Link
              to={`/profile/${user?.username}`}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;

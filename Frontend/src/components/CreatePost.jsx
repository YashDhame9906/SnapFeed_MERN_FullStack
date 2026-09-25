import React, { useState, useRef } from 'react';
import { postApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

const CreatePost = ({ onPostCreated, onCloseModal }) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setErrorMessage('');

    if (!file) return;

    // Validate mime-type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Please select a valid image format (JPG, PNG, WEBP).');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedFile) {
      setErrorMessage('Please select an image to share.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('caption', caption.trim());

      const response = await postApi.createPost(formData);
      if (response.success && response.data?.post) {
        handleClearImage();
        setCaption('');
        if (onPostCreated) {
          onPostCreated(response.data.post);
        }
        if (onCloseModal) {
          onCloseModal();
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-card">
      <div className="create-post-header">
        <UserAvatar user={user} size="sm" />
        <span className="create-post-user-tag">Posting as @{user?.username}</span>
      </div>

      {errorMessage && (
        <div className="alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-post-form">
        <textarea
          className="create-post-textarea"
          placeholder="Write a caption... (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          rows={3}
          disabled={isSubmitting}
        />

        <div className="create-post-caption-meta">
          <span className="char-counter">{caption.length} / 2200</span>
        </div>

        {/* Selected image preview */}
        {previewUrl ? (
          <div className="image-preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <button
              type="button"
              className="btn-remove-preview"
              onClick={handleClearImage}
              title="Remove image"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>
        ) : (
          <div
            className="file-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Click to upload an image (JPG, PNG, WEBP up to 5MB)</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
        />

        <div className="create-post-actions">
          {onCloseModal && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={!selectedFile || isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : 'Share Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

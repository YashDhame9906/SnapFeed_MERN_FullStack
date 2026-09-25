import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import CreatePost from './components/CreatePost';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Login from './pages/Login';
import Register from './pages/Register';

// Styles
import './styles/global.css';
import './styles/navbar.css';
import './styles/auth.css';
import './styles/feed.css';
import './styles/profile.css';

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Hide Navbar on dedicated auth pages
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-root">
      {!isAuthPage && (
        <Navbar onOpenCreate={() => setShowCreateModal(true)} />
      )}

      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile/edit" element={<EditProfile />} />
        </Route>

        {/* Accessible Routes (enhanced when authenticated) */}
        <Route path="/explore" element={<Explore />} />
        <Route path="/profile/:username" element={<Profile />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Create Post Modal from Navbar */}
      {showCreateModal && isAuthenticated && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-content post-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn-close-modal"
              onClick={() => setShowCreateModal(false)}
            >
              ×
            </button>
            <div style={{ padding: '20px' }}>
              <CreatePost
                onCloseModal={() => setShowCreateModal(false)}
                onPostCreated={() => {
                  setShowCreateModal(false);
                  // Refresh or notify home feed if on home page
                  if (location.pathname === '/') {
                    window.location.reload();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

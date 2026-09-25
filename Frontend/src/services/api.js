import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('snapfeed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response payload or error message
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong. Try again.';

    // If unauthorized on a protected endpoint, clear stale credentials
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('snapfeed_token');
        localStorage.removeItem('snapfeed_user');
      }
    }

    return Promise.reject(new Error(message));
  }
);

/* ================= Auth APIs ================= */
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

/* ================= Post APIs ================= */
export const postApi = {
  getFeed: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),
  getExplore: (page = 1, limit = 12) =>
    api.get(`/posts/explore?page=${page}&limit=${limit}`),
  getPostById: (id) => api.get(`/posts/${id}`),
  createPost: (formData) =>
    api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  unlikePost: (id) => api.post(`/posts/${id}/unlike`)
};

/* ================= Comment APIs ================= */
export const commentApi = {
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  addComment: (postId, text) => api.post(`/posts/${postId}/comments`, { text }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`)
};

/* ================= User APIs ================= */
export const userApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (formData) =>
    api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getFollowers: (username) => api.get(`/users/${username}/followers`),
  getFollowing: (username) => api.get(`/users/${username}/following`),
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.post(`/users/${userId}/unfollow`)
};

export default api;

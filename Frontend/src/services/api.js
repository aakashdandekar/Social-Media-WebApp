import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach token to every request if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('vibely_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (userId, email, password) =>
  API.post('/register', { 
    userId, 
    email, 
    password, 
    created_at: new Date().toISOString() 
  });

export const login = (email, password) =>
  API.post('/login', { email, password });

// Feed
export const getFeed = () => API.get('/');

// Posts
export const uploadPost = (file, caption) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caption', caption);
  return API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const likePost = (postId) => API.post(`/like/${postId}`);

export const addComment = (postId, commentText) =>
  API.post(`/add-comment/${postId}?comment_data=${encodeURIComponent(commentText)}`);

export const deleteComment = (postId) =>
  API.delete(`/delete-comment/${postId}`);

export const deletePost = (postId) => API.delete(`/post/${postId}`);

// Profile
export const getMyProfile = () => API.get('/profile');

export const getPublicProfile = (username) => API.get(`/profile/${username}`);

export const setupProfile = (bio) =>
  API.post(`/setup-profile/me?bio=${encodeURIComponent(bio)}`);

export const updateProfile = (bio) =>
  API.post(`/update-profile/me?bio=${encodeURIComponent(bio)}`);

// Follow
export const followUser = (userToFollowId) =>
  API.post(`/follow/${userToFollowId}`);

// Search
export const searchUser = (query) =>
  API.get(`/search?searched=${encodeURIComponent(query)}`);

export default API;

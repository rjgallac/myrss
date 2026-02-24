import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const AUTH_BASE = 'http://localhost:5000/auth';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

export const authAPI = {
  getCurrentUser: () => axios.get(`${AUTH_BASE}/me`, { withCredentials: true }),
  logout: () => axios.post(`${AUTH_BASE}/logout`, {}, { withCredentials: true })
};

export const feedAPI = {
  getFeeds: () => apiClient.get('/feeds'),
  addFeed: (feedUrl, title) => apiClient.post('/feeds', { feed_url: feedUrl, title }),
  removeFeed: (feedId) => apiClient.delete(`/feeds/${feedId}`)
};

export const itemAPI = {
  getItems: (params) => apiClient.get('/items', { params }),
  markAsRead: (itemIds) => apiClient.post('/items/mark-read', { item_ids: itemIds }),
  toggleSaved: (itemId) => apiClient.post('/items/toggle-saved', { item_id: itemId })
};

import axios from 'axios';
import { handleMockRequest, shouldUseMock } from './mockService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  adapter: async (config) => {
    // If in production/deployed environment without a configured remote backend,
    // or if explicitly using standalone mode, serve from client engine
    if (shouldUseMock()) {
      return handleMockRequest(config);
    }

    // Attempt real HTTP request
    try {
      const defaultAdapter = axios.getAdapter(axios.defaults.adapter || ['xhr', 'http']);
      return await defaultAdapter(config);
    } catch (error) {
      // If the backend is down, connection refused, or mixed-content blocked, seamlessly fall back
      if (!error.response) {
        console.warn('[FitLife] Backend unreachable, falling back to client storage engine.');
        return handleMockRequest(config);
      }
      throw error;
    }
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fitlife_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on 401 for protected data requests (not login/register attempts)
    const isAuthRoute =
      error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('fitlife_token');
      localStorage.removeItem('fitlife_user');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

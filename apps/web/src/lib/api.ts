import axios from 'axios';
import { clearToken, getToken } from './auth-storage';

/**
 * Single axios instance for the whole app.
 * - Request: attach the bearer token if we have one.
 * - Response: on 401 (token rejected OR user blocked/expired live), drop the
 *   token and bounce to /login. The backend re-checks access on every request
 *   (AGENTS.md §4), so a 401 here is authoritative.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      // Avoid a redirect loop if we're already on the login page.
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

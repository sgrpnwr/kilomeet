import axios from 'axios';

const API_URL = 'http://192.168.1.2:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// This gets set by AuthContext once it's mounted — lets the interceptor
// trigger a logout without api.ts needing to import AuthContext directly
// (which would create a circular import, since AuthContext imports `api`)
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);
import axios from 'axios';
import { readSession } from '../features/auth/session';

export const LOGIN_URL = '/api/auth/login';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use((config) => {
  const session = readSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url === LOGIN_URL;
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isLoginRequest) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

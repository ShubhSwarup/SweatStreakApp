import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { triggerLogout } from '../utils/authEvents';

export const BASE_URL = 'http://192.168.0.104:5000'
  // (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  // 'http://192.168.0.104:5000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored access token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token refresh on 401 ────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s, and don't retry refresh calls themselves
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Queue callers while a refresh is already in flight
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefresh = await AsyncStorage.getItem('refreshToken');
      if (!storedRefresh) throw new Error('No refresh token');

      // Use raw axios to avoid the request interceptor re-attaching the stale token
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
        refreshToken: storedRefresh,
      });

      const { accessToken, refreshToken } = data as { accessToken: string; refreshToken: string };

      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
      ]);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      processQueue(null, accessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      // Signal authStore to reset — avoids a circular import
      triggerLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;

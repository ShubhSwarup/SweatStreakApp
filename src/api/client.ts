import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { triggerLogout } from '../utils/authEvents';
import { log } from '../utils/logger';

// Read base URL from app.json → expo.extra.apiBaseUrl, fall back to hardcoded IP.
export const BASE_URL = 'http://192.168.0.104:5000';
// export const BASE_URL = 'http://10.156.227.15:5000';


// export const BASE_URL =
//   (Constants.expoConfig?.extra?.apiBaseUrl as string) ??
//   'http://192.168.0.104:500';

  // export const BASE_URL = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  // 'http://10.156.227.15:5000';

log.info('API', 'client init', { baseURL: BASE_URL });

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach token + log every outgoing call ─────────────

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Tag each request with a timestamp so we can measure latency
  (config as any)._startedAt = Date.now();

  log.debug(
    'API',
    `→ ${(config.method ?? 'GET').toUpperCase()} ${config.url}`,
    config.data ? JSON.parse(JSON.stringify(config.data)) : undefined,
  );

  return config;
});

// ─── Response interceptor — log success + handle 401 / token refresh ─────────

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => {
    const elapsed = Date.now() - ((response.config as any)._startedAt ?? Date.now());
    log.debug(
      'API',
      `← ${response.status} ${response.config.url} (${elapsed}ms)`,
    );
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '?';
    const method = (error.config?.method ?? 'GET').toUpperCase();
    const elapsed = Date.now() - ((error.config as any)?._startedAt ?? Date.now());

    if (status === 401) {
      log.warn('API', `401 ${method} ${url} — attempting token refresh`);
    } else {
      // Log every non-401 error so it's visible in the Metro console
      log.error('API', `${method} ${url}`, error, {
        status,
        elapsed: `${elapsed}ms`,
        responseBody: error.response?.data,
      });
    }

    const originalRequest = error.config;

    // Detect Render cold-start: 404 with plain-text body (not JSON from Express).
    // After app.js now returns JSON for all real 404s, string body = proxy wake-up.
    // Also retry on network errors (no response at all).
    const isTransient =
      (!error.response && !originalRequest._retry) ||
      (status === 404 && typeof error.response?.data === 'string' && !originalRequest._retryCount);

    if (isTransient) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      if (originalRequest._retryCount <= 2) {
        log.warn('API', `transient failure — retry ${originalRequest._retryCount}/2: ${method} ${url}`);
        await new Promise<void>(resolve => setTimeout(resolve, 800 * originalRequest._retryCount));
        return apiClient(originalRequest);
      }
    }

    // Only intercept 401s once; don't retry refresh calls
    if (status !== 401 || originalRequest._retry) {
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
      if (!storedRefresh) throw new Error('No refresh token stored');

      // Use raw axios to avoid re-attaching the stale access token
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
        refreshToken: storedRefresh,
      });

      const { accessToken, refreshToken } = data as {
        accessToken: string;
        refreshToken: string;
      };

      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
      ]);

      log.info('API', 'token refreshed successfully');

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      processQueue(null, accessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      log.error('API', 'token refresh failed — logging out', refreshError);
      processQueue(refreshError, null);
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      triggerLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;

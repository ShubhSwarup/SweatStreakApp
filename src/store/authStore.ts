import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { registerLogoutCallback } from '../utils/authEvents';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialising: boolean; // true while reading AsyncStorage on launch
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  loadFromStorage: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => {
  // Register the bridge callback once at store creation.
  // The client calls triggerLogout() when the refresh token is rejected,
  // which in turn calls this, clearing in-memory auth state.
  registerLogoutCallback(() => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  });

  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialising: true,
    error: null,

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const { user, accessToken, refreshToken } = await authApi.login(email, password);
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
        ]);
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Login failed';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    register: async (name, email, password) => {
      set({ isLoading: true, error: null });
      try {
        const { user, accessToken, refreshToken } = await authApi.register(name, email, password);
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
        ]);
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? 'Registration failed';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    logout: async () => {
      const { refreshToken } = get();
      try {
        if (refreshToken) await authApi.logout(refreshToken);
      } catch {
        // best-effort — proceed with local logout regardless
      }
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    },

    refreshTokens: async () => {
      const { refreshToken } = get();
      if (!refreshToken) throw new Error('No refresh token');
      const result = await authApi.refreshToken(refreshToken);
      await AsyncStorage.multiSet([
        ['accessToken', result.accessToken],
        ['refreshToken', result.refreshToken],
      ]);
      set({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    },

    setTokens: (accessToken, refreshToken) => {
      set({ accessToken, refreshToken });
    },

    loadFromStorage: async () => {
      set({ isInitialising: true });
      try {
        const [[, accessToken], [, refreshToken]] = await AsyncStorage.multiGet([
          'accessToken',
          'refreshToken',
        ]);

        if (accessToken && refreshToken) {
          // Both tokens present — trust them; the 401 interceptor will refresh if expired
          set({ accessToken, refreshToken, isAuthenticated: true });
        } else if (refreshToken) {
          // Access token gone (app killed mid-life) — proactively refresh
          try {
            const result = await authApi.refreshToken(refreshToken);
            await AsyncStorage.multiSet([
              ['accessToken', result.accessToken],
              ['refreshToken', result.refreshToken],
            ]);
            set({
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              isAuthenticated: true,
            });
          } catch {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          }
        }
        // else: no tokens — stay unauthenticated
      } catch {
        // Storage read error — stay unauthenticated
      } finally {
        set({ isInitialising: false });
      }
    },

    clearError: () => set({ error: null }),
  };
});

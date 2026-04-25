import { create } from 'zustand';
import * as dashboardApi from '../api/dashboard';
import type { DashboardData } from '../types/api';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchDashboard: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState & DashboardActions>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardApi.getDashboard();
      set({ data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err?.message ?? 'Failed to load dashboard' });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ data: null, isLoading: false, error: null }),
}));

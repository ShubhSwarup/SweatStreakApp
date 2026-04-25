import { create } from 'zustand';
import * as workoutPlanApi from '../api/workoutPlan';
import type { WorkoutPlan, TodayPlan, CreatePlanPayload } from '../types/api';

interface PlanState {
  plans: WorkoutPlan[];
  activePlan: WorkoutPlan | null;
  todayPlan: TodayPlan | null;
  selectedPlan: WorkoutPlan | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface PlanActions {
  fetchPlans: () => Promise<void>;
  fetchPlanById: (planId: string) => Promise<void>;
  fetchActivePlan: () => Promise<void>;
  fetchTodayPlan: () => Promise<void>;
  createPlan: (payload: CreatePlanPayload) => Promise<WorkoutPlan | null>;
  updatePlan: (planId: string, payload: CreatePlanPayload) => Promise<WorkoutPlan | null>;
  activatePlan: (planId: string) => Promise<void>;
  duplicatePlan: (planId: string) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  skipDay: () => Promise<void>;
  restartPlan: () => Promise<void>;
  clearSelectedPlan: () => void;
  clearError: () => void;
  reset: () => void;
}

export const usePlanStore = create<PlanState & PlanActions>((set, get) => ({
  plans: [],
  activePlan: null,
  todayPlan: null,
  selectedPlan: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const plans = await workoutPlanApi.getPlans();
      set({ plans, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to load plans' });
    }
  },

  fetchPlanById: async (planId) => {
    // Prefer already-loaded plan to avoid an extra round-trip (and handle
    // missing GET /:planId endpoint gracefully).
    const cached = get().plans.find(p => p._id === planId);
    if (cached) {
      set({ selectedPlan: cached });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const plan = await workoutPlanApi.getPlanById(planId);
      set({ selectedPlan: plan, isLoading: false });
    } catch {
      // Fallback: fetch all plans and find by ID
      try {
        const plans = await workoutPlanApi.getPlans();
        const plan = plans.find(p => p._id === planId);
        if (plan) {
          set({ selectedPlan: plan, plans, isLoading: false });
        } else {
          set({ isLoading: false, error: 'Plan not found' });
        }
      } catch (err: any) {
        set({ isLoading: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to load plan' });
      }
    }
  },

  fetchActivePlan: async () => {
    set({ isLoading: true, error: null });
    try {
      const plan = await workoutPlanApi.getActivePlan();
      set({ activePlan: plan, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to load active plan' });
    }
  },

  fetchTodayPlan: async () => {
    set({ isLoading: true, error: null });
    try {
      const plan = await workoutPlanApi.getTodayPlan();
      set({ todayPlan: plan, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to load today\'s plan' });
    }
  },

  createPlan: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const plan = await workoutPlanApi.createPlan(payload);
      // Creating a plan auto-activates it; deactivate all others in local state
      set(state => ({
        plans: [plan, ...state.plans.map(p => ({ ...p, isActive: false }))],
        activePlan: plan,
        isSaving: false,
      }));
      return plan;
    } catch (err: any) {
      set({ isSaving: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to create plan' });
      return null;
    }
  },

  updatePlan: async (planId, payload) => {
    set({ isSaving: true, error: null });
    try {
      const plan = await workoutPlanApi.updatePlan(planId, payload);
      set(state => ({
        plans: state.plans.map(p => (p._id === planId ? plan : p)),
        selectedPlan: state.selectedPlan?._id === planId ? plan : state.selectedPlan,
        activePlan: state.activePlan?._id === planId ? plan : state.activePlan,
        isSaving: false,
      }));
      return plan;
    } catch (err: any) {
      set({ isSaving: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to update plan' });
      return null;
    }
  },

  activatePlan: async (planId) => {
    set({ isSaving: true, error: null });
    try {
      const plan = await workoutPlanApi.activatePlan(planId);
      set(state => ({
        plans: state.plans.map(p => ({ ...p, isActive: p._id === planId })),
        activePlan: plan,
        isSaving: false,
      }));
    } catch (err: any) {
      set({ isSaving: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to activate plan' });
    }
  },

  duplicatePlan: async (planId) => {
    set({ isSaving: true, error: null });
    try {
      const plan = await workoutPlanApi.duplicatePlan(planId);
      set(state => ({
        plans: [plan, ...state.plans],
        isSaving: false,
      }));
    } catch (err: any) {
      set({ isSaving: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to duplicate plan' });
    }
  },

  deletePlan: async (planId) => {
    set({ isSaving: true, error: null });
    try {
      await workoutPlanApi.deletePlan(planId);
      set(state => ({
        plans: state.plans.filter(p => p._id !== planId),
        activePlan: state.activePlan?._id === planId ? null : state.activePlan,
        selectedPlan: state.selectedPlan?._id === planId ? null : state.selectedPlan,
        isSaving: false,
      }));
    } catch (err: any) {
      set({ isSaving: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to delete plan' });
    }
  },

  skipDay: async () => {
    set({ isSaving: true, error: null });
    try {
      const plan = await workoutPlanApi.skipDay();
      set(state => ({
        activePlan: plan,
        plans: state.plans.map(p => (p._id === plan._id ? plan : p)),
        isSaving: false,
      }));
    } catch (err: any) {
      set({ isSaving: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to skip day' });
    }
  },

  restartPlan: async () => {
    set({ isSaving: true, error: null });
    try {
      const plan = await workoutPlanApi.restartPlan();
      set(state => ({
        activePlan: plan,
        plans: state.plans.map(p => (p._id === plan._id ? plan : p)),
        selectedPlan: state.selectedPlan?._id === plan._id ? plan : state.selectedPlan,
        isSaving: false,
      }));
    } catch (err: any) {
      set({ isSaving: false, error: err?.response?.data?.message ?? err?.message ?? 'Failed to restart plan' });
    }
  },

  clearSelectedPlan: () => set({ selectedPlan: null }),
  clearError: () => set({ error: null }),
  reset: () => set({ plans: [], activePlan: null, todayPlan: null, selectedPlan: null, isLoading: false, isSaving: false, error: null }),
}));
